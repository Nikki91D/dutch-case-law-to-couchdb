var nodeTypes = {
    1: "element",
    2: "attribute",
    3: "text",
    4: "cdata_section",
    5: "entity_reference",
    6: "entity",
    7: "processing_instruction",
    8: "comment",
    9: "document",
    10: "document_type",
    11: "document_fragment",
    12: "notation"
};

var forAllChildren = function (node, f) {
    var cs = getChildren(node);
    if (cs) {
        for (var ci = 0; ci < cs.length; ci++) {
            var child = cs[ci];
            f(child);
        }
    }
};
var getChildren = function (node) {
    if (node) {
        var type = nodeTypes[node[0]];
        if (type == "element") {
            return node[2];
        } else if (type == "document") {
            return node[1];
        } else {
            return null;
        }
    }
};
var getTagName = function (node) {
    if (node) {
        if (nodeTypes[node[0]] == "element") {
            return node[1];
        } else {
            return null;
        }
    }
};

var hasTag = function (node, tagName) {
    if (getTagName(node) == tagName) {
        return true;
    } else {
        var cs = getChildren(node);
        if (cs)
            for (var i = 0; i < cs.length; i++) {
                if (hasTag(cs[i], tagName)) {
                    return true;
                }
            }
    }
    return false;
};

module.exports = {
    nodeTypes: nodeTypes,
    getChildren: getChildren,
    getTagName: getTagName,
    forAllChildren: forAllChildren,
    hasTag: hasTag
};

