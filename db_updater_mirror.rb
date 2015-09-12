require_relative 'couch/cloudant_rechtspraak'
require_relative 'rechtspraak-nl/rechtspraak_utils'

class DbUpdaterMirror

  def initialize
    @couch_tokens = CloudantRechtspraak.new
  end

  # Updates our database that clones Rechtspraak.nl's documents.
  # Params:
  # +enforce_consistency+ Whether to scan all documents on Rechtspraak.nl (~330,000) to make sure that our db doesn't
  # miss anything, or just update from the last time that this script completed successfully.
  def start(enforce_consistency)
    today = Date.today.strftime('%Y-%m-%d')
    doc_last_updated = @couch_tokens.get_doc('informal_schema', 'general')

    if enforce_consistency
      since = '1000-01-01'
    else
      since = doc_last_updated['date_last_updated_mirror']
    end

    page_num = 0
    RechtspraakUtils::for_source_docs(since) do |docs|
      page_num += 1
      # Get docs to update
      update_docs = {}
      docs.each_slice(100) do |subgroup|
        evaluate_eclis_to_update(subgroup) do |id, our_data, source_data|
          if our_data
            update_docs[id] = our_data
          else
            update_docs[id] = {
                _rev: nil,
                modified: source_data[:updated]
            }
          end
        end
      end
      if update_docs.length>0
        puts "#{update_docs.length} new docs on page #{page_num}"
      end

      # Update docs
      if update_docs.length > 0
        revs = {}
        new_docs = []
        update_docs.each do |ecli, data|
          if data[:_rev]
            revs[ecli] = data[:_rev]
          end
          unless enforce_consistency
            # puts ecli
          end
          new_docs << ecli
        end

        @couch_tokens.update_docs(new_docs, revs)
      end
    end

    # Update the document that tracks our last update date
    doc_last_updated['date_last_updated_mirror'] = today
    @couch_tokens.put('/informal_schema/general', doc_last_updated.to_json)
  end

  private
  # Checks given ECLIs to our database; call block for those we wish do update
  def evaluate_eclis_to_update(source_docs, &block)
    rows = @couch_tokens.get_ecli_last_modified source_docs
    our_revs = {}
    rows.each do |row|
      our_revs[row['id']] = {
          :_rev => row['value']['_rev'],
          :modified => row['value']['modified']
      }
    end

    source_docs.each do |doc|
      unless our_revs[doc[:id]] and our_revs[doc[:id]][:modified].gsub(/\+[0-9]{2}:[0-9]{2}$/, '') == doc[:updated].gsub(/\+[0-9]{2}:[0-9]{2}$/, '')
        block.call(doc[:id], our_revs[doc[:id]], doc)
      end
    end
  end
end