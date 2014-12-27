require 'net/http'
require 'cgi'
require 'json'
require 'objspace'
require_relative 'secret'

module Couch
  class Server
    def initialize(host, port, options = nil)
      @host = host
      @port = port
      @options = options
    end

    def delete(uri)
      req=Net::HTTP::Delete.new(uri)
      req.basic_auth @options[:name], @options[:password]
      request(req)
    end

    def get(uri)
      req = Net::HTTP::Get.new(uri)
      req.basic_auth @options[:name], @options[:password]
      request(req)
    end

    def put(uri, json)
      req = Net::HTTP::Put.new(uri)
      req.basic_auth @options[:name], @options[:password]
      req["Content-Type"] = "text/plain;charset=utf-8"
      req.body = json
      request(req)
    end

    def post(uri, json)
      req = Net::HTTP::Post.new(uri)
      req.basic_auth @options[:name], @options[:password]
      req["Content-Type"] = "application/json;charset=UTF-8"
      req.body = json
      request(req)
    end

    def request(req)
      res = Net::HTTP.start(@host, @port) do |http|
        http.request(req)
      end
      unless res.kind_of?(Net::HTTPSuccess)
        puts "CouchDb responsed with error code #{res.code}"
        handle_error(req, res)
      end
      res
    end

    def get_rows_for_view(database, design_doc, view, query_params=nil)
      postfix = create_postfix(query_params)

      uri = URI::encode "/#{database}/_design/#{design_doc}/_view/#{view}#{postfix}"
      res = get(uri)
      JSON.parse(res.body.force_encoding('utf-8'))['rows']
    end

    def get_all_ids(database, params)
      ids=[]
      postfix = create_postfix(params)

      uri = URI::encode "/#{database}/_all_docs#{postfix}"
      res = get(uri)
      result = JSON.parse(res.body)
      result['rows'].each do |row|
        if row['error']
          puts "#{row['key']}: #{row['error']}"
          puts "#{row['reason']}"
        else
          ids << row['id']
        end
      end

      ids
    end

    # Returns an array of the full documents for given database, possibly filtered with given parameters. Note that the 'include_docs' parameter must be set to true for this.
    def get_all_docs(database, params)
      unless params.include? 'include_docs' or params.include? :include_docs
        params.merge!({:include_docs => true})
      end
      postfix = create_postfix(params)

      uri = URI::encode "/#{database}/_all_docs#{postfix}"
      res = get(uri)
      result = JSON.parse(res.body)
      docs = []
      result['rows'].each do |row|
        if row['error'] or !row['doc']
          puts "#{row['key']}: #{row['error']}"
          puts "#{row['reason']}"
        else
          docs << row['doc']
        end
      end
      docs
    end

    # Flushes the given hashes to CouchDB
    def flush_bulk(database, docs)
      body = {:docs => docs}.to_json #.force_encoding('utf-8')
      post("/#{database}/_bulk_docs", body)
    end

    # Returns an array of the full documents for given view, possibly filtered with given parameters. Note that the 'include_docs' parameter must be set to true for this.
    def get_docs_for_view(db, design_doc, view, params={})
      params.merge!({:include_docs => true})
      rows = get_rows_for_view(db, design_doc, view, params)
      docs = []
      rows.each do |row|
        docs << row['doc']
      end
      docs
    end

    def bulk_delete(database, docs)
      json = {:docs => docs}.to_json
      post("/#{database}/_bulk_docs", json)
    end

    #Returns parsed doc from database
    def get_doc(database, id)
      res = get("/#{database}/#{CGI.escape(id)}")
      JSON.parse(res.body)
    end

    def get_attachment_str(db, id, attachment)
      get("/#{db}/#{CGI.escape(id)}/#{attachment}").body
    end

    def flush_bulk_throttled(db, docs, max_size=15)
      puts "Flushing #{docs.length} docs"
      bulk = []
      bytesize = 0
      docs.each do |doc|
        bulk << doc
        bytesize += get_bytesize(doc)
        if bytesize/1024/1024 > max_size
          res = flush_bulk(db, bulk)
          error_count=0
          if res.body
            begin
              JSON.parse(res.body).each do |d|
                error_count+=1 if d['error']
              end
            end
          end
          puts "> Flushed #{bulk.length} docs; #{error_count} errors"
          bulk.clear
          bytesize=0
        end
      end
      if bulk.length > 0
        flush_bulk(db, bulk)
        bulk.clear
      end
    end

    def flush_bulk_if_big_enough(db, docs, flush_size_mb=50)
      if get_bytesize_array(docs) >= flush_size_mb*1024*1024 or docs.length >= 500
        flush_bulk_throttled(db, docs)
        docs.clear
      end
    end

    def get_bytesize_array(docs)
      bytesize = 0
      docs.each do |doc|
        bytesize+=get_bytesize doc
      end
      bytesize
    end

    def get_bytesize(doc)
      ObjectSpace.memsize_of doc
      # bytesize=0
      # if doc['_attachments']
      #   doc['_attachments'].each do |name, attachment|
      #     data = attachment['data'] || attachment[:data]
      #     if data
      #       bytesize += data.bytesize
      #       bytesize += name.bytesize
      #     end
      #   end
      #   doc.each do |_, val|
      #     if val.is_a? String
      #       bytesize += val.bytesize
      #     end
      #   end
      # end
      # bytesize
    end

    private
    def handle_error(req, res)
      e = RuntimeError.new("#{res.code}:#{res.message}\nMETHOD:#{req.method}\nURI:#{req.path}\n#{res.body}")
      raise e
    end

    def create_postfix(query_params, default='')
      if query_params
        params_a = []
        query_params.each do |key, value|
          params_a << "#{key}=#{value}"
        end
        postfix = "?#{params_a.join('&')}"
      else
        postfix = default
      end
      postfix
    end
  end

  WETTEN_CONNECTION = Server.new(
      "#{Secret::WETTEN_NAME}.cloudant.com", "80",
      {name:
           Secret::WETTEN_NAME,
       password:
           Secret::CLOUDANT_PASSWORD
      }
  )
  CLOUDANT_CONNECTION = Server.new(
      "#{Secret::RECHTSPRAAK_NAME}.cloudant.com", "80",
      {name:
           Secret::RECHTSPRAAK_NAME,
       password:
           Secret::CLOUDANT_PASSWORD
      }
  )
  LAW = Server.new(
      "lawly.cloudant.com", "80",
      {name:
           'lawly',
       password:
           Secret::CLOUDANT_PASSWORD
      }
  )
end