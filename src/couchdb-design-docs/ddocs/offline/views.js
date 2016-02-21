var fs = require('fs');

var functions = {
        idf: {
            map: function (doc) {
                if (doc.xml) {
                    var Snowball = null;
                    try {
                        //noinspection NodeRequireContents
                        Snowball = require('views/lib/snowball');
                    } catch (err) {
                        //noinspection JSFileReferences
                        Snowball = require('../snowball.js');
                    }
                    var stemmer = new Snowball('Dutch');
                    Snowball = null;

                    var natural = null;
                    try {
                        //noinspection NodeRequireContents
                        natural = require('views/lib/natural');
                    } catch (err) {
                        //noinspection JSFileReferences
                        natural = require('../natural.js');
                    }
                    var tokenizer = new natural.WordPunctTokenizer();


                    var xml = null;
                    try {
                        //noinspection NodeRequireContents
                        xml = require('views/lib/xml');
                    } catch (err) {
                        //noinspection JSFileReferences
                        xml = require('../xml_util.js');
                    }

                    if (xml.hasTag(doc.xml, 'section')) {
                        var getRole = function (attrs) {
                            if (attrs) {
                                for (var i = 0; i < attrs.length; i++) {
                                    var key = attrs[i][0];
                                    if (key == 'role') {
                                        return attrs[i][1];
                                    }
                                }
                            }
                            return null;
                        };

                        var emitElements = function (node, sectionRole, inTitle) {
                            if (xml.getTagName(node) == 'section') {
                                sectionRole = node.length > 3 ? getRole(node[3]) : null;
                            }
                            if (xml.getTagName(node) == 'title') {
                                inTitle = true;
                            }

                            xml.forAllChildren(node, function (child) {
                                if (typeof child == 'string') {
                                    //Found string block
                                    emit(603, 1);
                                    if (child.length > 0) {
                                        child = child.trim();
                                        if (child.length > 0) {
                                            var normalized = child.trim().toLowerCase()
                                                .replace(/[0-9]+/g, '_NUM')
                                                .replace(/\b(de|het|een)\b/g, '_ART')
                                                .replace(/\b(i{1,3})\b/g, '_NUM') // i, ii, iii
                                                .replace(/\b((i?[vx])|([xv]i{0,3}))\b/g, '_NUM')// iv, v, vi, vii, viii,ix,x,xi,xii,xiii
                                                .replace(/[;:\.]+/g, ' _PUNCT ') // normalize and separate punctation
                                                .replace(/\s\s+/g, ' ') // replace double spaces with single space
                                                .trim()
                                                ;
                                            if (normalized.length > 0) {
                                                // eliminate doubles, because we are counting the document frequency
                                                var words = Object.create(null);

                                                //var tokens = normalized.split(' ');
                                                var tokens = tokenizer.tokenize(normalized);

                                                for (var i = 0; i < tokens.length; i++) {
                                                    var token = tokens[i].trim();
                                                    if (token.length > 0) {
                                                        stemmer.setCurrent(token);
                                                        stemmer.stem();
                                                        var stemmed = stemmer.getCurrent();
                                                        if (!words[stemmed]) {
                                                            //noinspection NodeModulesDependencies
                                                            emit([inTitle, sectionRole, stemmed], 1);
                                                            words[stemmed] = true;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    emitElements(child, sectionRole, inTitle);
                                }
                            });
                        };
                        emitElements(xml.findContentNode(doc.xml), null, false);
                    }
                }
            },
            reduce: 'sum'
        },
        tfSection: {
            map: function (doc) {
                if (doc.xml) {
                    var natural = null;
                    try {
                        //noinspection NodeRequireContents
                        natural = require('views/lib/natural');
                    } catch (err) {
                        //noinspection JSFileReferences
                        natural = require('../../natural.js');
                    }
                    var tokenizer = new natural.WordPunctTokenizer();

                    var Snowball = null;
                    try {
                        //noinspection NodeRequireContents
                        Snowball = require('views/lib/snowball');
                    } catch (err) {
                        //noinspection JSFileReferences
                        Snowball = require('../../snowball.js');
                    }
                    var stemmer = new Snowball('Dutch');
                    Snowball = null;

                    var xml = null;
                    try {
                        //noinspection NodeRequireContents
                        xml = require('views/lib/xml');
                    } catch (err) {
                        //noinspection JSFileReferences
                        xml = require('../../xml_util.js');
                    }

                    if (xml.hasTag(doc.xml, 'section')) {
                        var getRole = function (attrs) {
                            if (attrs) {
                                for (var i = 0; i < attrs.length; i++) {
                                    var key = attrs[i][0];
                                    if (key == 'role') {
                                        return attrs[i][1];
                                    }
                                }
                            }
                            return null;
                        };

                        var emitElements = function (node, sectionRole, inTitle) {
                            if (xml.getTagName(node) == 'section') {
                                sectionRole = node.length > 3 ? getRole(node[3]) : null;
                            }
                            if (xml.getTagName(node) == 'title') {
                                inTitle = true;
                            }

                            xml.forAllChildren(node, function (child) {
                                if (typeof child == 'string' && inTitle) {
                                    // Only emit for titles text blocks
                                    emit(603, 1);
                                    if (child.length > 0) {
                                        child = child.trim();
                                        if (child.length > 0) {
                                            var normalized = child.trim().toLowerCase()
                                                .replace(/[0-9]+/g, '_NUM')
                                                .replace(/\b(de|het|een)\b/g, '_ART')
                                                .replace(/\b(i{1,3})\b/g, '_NUM') // i, ii, iii
                                                .replace(/\b((i?[vx])|([xv]i{0,3}))\b/g, '_NUM')// iv, v, vi, vii, viii,ix,x,xi,xii,xiii
                                                .replace(/[;:\.]+/g, ' _PUNCT ') // normalize and separate punctation
                                                .replace(/\s\s+/g, ' ') // replace double spaces with single space
                                                .trim()
                                                ;
                                            if (normalized.length > 0) {
                                                // eliminate doubles, because we are counting the document frequency
                                                var words = Object.create(null);

                                                //var tokens = normalized.split(' ');
                                                var tokens = tokenizer.tokenize(normalized);

                                                for (var i = 0; i < tokens.length; i++) {
                                                    var token = tokens[i].trim();
                                                    if (token.length > 0) {
                                                        stemmer.setCurrent(token);
                                                        stemmer.stem();
                                                        var stemmed = stemmer.getCurrent();
                                                        var count = words[stemmed] || 0;
                                                        words[stemmed] = count + 1;
                                                    }
                                                }
                                                for (var word in words) {
                                                    //noinspection NodeModulesDependencies
                                                    emit([inTitle, sectionRole, word], words[word]);
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    emitElements(child, sectionRole, inTitle);
                                }
                            });
                        };
                        emitElements(xml.findContentNode(doc.xml), null, false);
                    }
                }
            },
            reduce: 'sum'
        },
        tfInfoTag: {
            map: function (doc) {
                if (doc.xml) {
                    var natural = null;
                    try {
                        //noinspection NodeRequireContents
                        natural = require('views/lib/natural');
                    } catch (err) {
                        //noinspection JSFileReferences
                        natural = require('../natural.js');
                    }
                    var tokenizer = new natural.WordPunctTokenizer();

                    var Snowball = null;
                    try {
                        //noinspection NodeRequireContents
                        Snowball = require('views/lib/snowball');
                    } catch (err) {
                        //noinspection JSFileReferences
                        Snowball = require('../snowball.js');
                    }
                    var stemmer = new Snowball('Dutch');
                    Snowball = null;

                    var xml = null;
                    try {
                        //noinspection NodeRequireContents
                        xml = require('views/lib/xml');
                    } catch (err) {
                        //noinspection JSFileReferences
                        xml = require('../xml_util.js');
                    }

                    var concatenateSpacedWords = function (innerText) {
                        // eg, R E C H T B A N K  T E  L O C A T I E
                        if (innerText.match(/R E C H T B A N K/)) {
                            console.log(innerText);
                        }
                        var m = innerText.match(/\b(([A-Z] )+[A-Z](  ([A-Z] )+[A-Z])?)\b/);
                        if (m) {
                            var split = m[1].split('  ');
                            for (var s = 0; s < split.length; s++) {
                                split[s] = split[s].split(' ').join('');
                            }
                            if (split.length > 1) {
                                console.log(split);
                                console.log(split.join(' '));
                                console.log('');
                            }
                            return split.join(' ')
                        } else {
                            return innerText;
                        }
                    };

                    //console.log("hastag?");
                    if (xml.hasTag(doc.xml, /\.info$/)) {
                        var emitWordsInTextBlocks = function (node) {
                            if (typeof node == 'string') {
                                var innerText = (node);
                                innerText = concatenateSpacedWords(innerText);

                                var normalized = innerText.trim().toLowerCase()
                                    .replace(/[0-9]+/g, '_NUM')
                                    .replace(/\b(de|het|een)\b/g, '_ART')
                                    .replace(/\b(i{1,3})\b/g, '_NUM') // i, ii, iii
                                    .replace(/\b((i?[vx])|([xv]i{0,3}))\b/g, '_NUM')// iv, v, vi, vii, viii,ix,x,xi,xii,xiii
                                    .replace(/[;:\.]+/g, ' _PUNCT ') // normalize and separate punctation
                                    .replace(/\s\s+/g, ' ') // replace double spaces with single space
                                    .trim();
                                if (normalized.length > 0) {
                                    // eliminate doubles, because we are counting the document frequency
                                    var wordCount = Object.create(null);

                                    //var tokens = normalized.split(' ');
                                    var tokens = tokenizer.tokenize(normalized);

                                    for (var i = 0; i < tokens.length; i++) {
                                        var token = tokens[i].trim();
                                        if (token.length > 0) {
                                            stemmer.setCurrent(token);
                                            stemmer.stem();
                                            var stemmed = stemmer.getCurrent();
                                            var count = wordCount[stemmed] || 0;
                                            wordCount[stemmed] = count + 1;
                                        }
                                    }
                                    for (var word in wordCount) {
                                        //noinspection NodeModulesDependencies
                                        emit([word], wordCount[word]);
                                    }
                                    emit(603, 1);
                                }
                            } else {
                                xml.forAllChildren(node, emitWordsInTextBlocks);
                            }
                        };
                        var emitWordsWhenInfoFound = function (node) {
                            //console.log("emitting");
                            if (xml.getTagName(node) && xml.getTagName(node).match(/\.info$/)) {
                                emitWordsInTextBlocks(node);
                            } else {
                                xml.forAllChildren(node, emitWordsWhenInfoFound);
                            }
                        };
                        emitWordsWhenInfoFound(xml.findContentNode(doc.xml));
                    }
                }
            },
            reduce: 'sum'
        },
        lib: {
            "natural": fs.readFileSync('../natural.min.js', {encoding: 'utf-8'}),
            "xml": fs.readFileSync('../xml_util.min.js', {encoding: 'utf-8'}),
            "snowball": fs.readFileSync('../snowball.js', {encoding: 'utf-8'})
        }
    }
    ;

module.exports = functions;
