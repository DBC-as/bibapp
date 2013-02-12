require("qp")(global);

// simplify opensearch-response-xml into json
function openSearchResponseToJson(jsonml) {
    jsonml = jsonml[2][2][2];
    var result = {};
    result["results"] = [];
    for(var i = 2; i < jsonml.length; ++i) {
        var current = jsonml[i];
        var tagname = current[0];
        if(tagname === "hitCount") {
            result["hitCount"] = Number(current[2]);
        } else if(tagname === "searchResult") {
            var objects = [];
            current = current[2];
            for(var j = 2; j < current.length; ++j) {
                if(current[j][0] === "object") {
                    var object = [];
                    for(var k = 2; k < current[j].length; ++k) {
                        if(current[j][k][0] === "dkabm:record") {
                            object = object.concat(current[j][k].slice(2));
                        } else {
                            object.push(current[j][k]);
                        }
                    }
                    objects.push(object);
                }
            }
            result["results"].push(objects);
        }
    }
    return result;
}

function openSearchEnvelope(query, first) {
    return qp.jsonml.toString(["soap:Envelope", {
            "xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
            "xmlns": "http://oss.dbc.dk/ns/opensearch"},
        ["soap:Body", ["searchRequest",
            ["query", query],    ["start", first + 1],
            ["profile", "test"], ["agency", "100200"],
            ["stepValue", "10"]]]]);
}

function openSearchSimple(query, first, callback) {
    var openSearchUrl = "http://opensearch.addi.dk/2.2/";

    // send the query
    qp.sys.read(openSearchUrl, {post: {xml: openSearchEnvelope(query, first)}}, handleResponse);
    function handleResponse(err, data) {
        if(err) return callback(err);

        // parse xml, and skip containing tags.
        var jsonml = qp.jsonml.fromString(data)[0];

        // throw on error message
        if(jsonml[2][2][2][0] === "error") return callback(qp.jsonml.toString(jsonml));

        callback(null, openSearchResponseToJson(jsonml));
    }
}

function clientOpenSearch(client) {
    openSearchSimple(query, first, function(err, result) {
        if(err) {
            client.error(err);
        } else {
            client.json(result);
        }
    });
}

function showSearchResults(client, err, results) {
    if(err) return client.error(err);
    if(client.route.type === "json") return client.json(results);
    client.jsonml(["div", "TODO: format and return as jsonml-html here."]);
}

function search(client) {
    var query = client.route.args[0];
    var first = Number(client.route.args[1]) || 0;
    var showFn = showSearchResults.bind(null, client);

    if(qp.platform.nodejs) {
        openSearchSimple(query, first, showFn);

    } else if(qp.platform.html5) {
        qp.ui.showLoadingIndicator({title: "Søger..."});
        qp.route.rpc("search", {args: [query, first]}, showFn);

    } else {
        throw "unknown platform"
    }
}

function bibentry(client) {
    client.json(client);
}

function runTests(client) {
    client.text("done");
}

qp.route.add("search", search);
qp.route.add("entry", bibentry);
qp.route.add("test", runTests);
