require("qp")(global);

function directSearch(client) {
    var query = client.route.args[0];
    var first = Number(client.route.args[1]) || 0;
    var openSearchUrl = "http://opensearch.addi.dk/2.2/";
    var searchEnvelope = qp.jsonml.toString(["soap:Envelope", {
            "xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
            "xmlns": "http://oss.dbc.dk/ns/opensearch"},
        ["soap:Body", ["searchRequest",
            ["query", query],    ["start", first + 1],
            ["profile", "test"], ["agency", "100200"],
            ["stepValue", "10"]]]]);

    // send the query
    qp.sys.read(openSearchUrl, {post: {xml: searchEnvelope}}, handleResponse);
    function handleResponse(err, data, opt) {
        if(err) throw err;

        // parse xml, and skip containing tags.
        var jsonml = qp.jsonml.fromString(data)[0][2][2][2];

        // throw on error message
        if(jsonml[0] === "error") throw qp.jsonml.toString(jsonml);

        console.log(data);
        // transform the xml into som slightly more friendly json
        var result = {first: first, results: []};
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
                            } else if(current[j][k][0] === "dkabm:record") {
                                object.push(current[j][k]);
                            }
                        }
                        objects.push(object);
                    }
                }
                result.results.push(objects);
            }
        }
        client.json(result);
    }
}

function showSearchResults(client, results) {
}

function search(client) {
    if(qp.platform.nodejs) {
        directSearch(client);
    } else if(qp.platform.html5) {
        qp.ui.showLoadingIndicator({title: "Søger..."});
        qp.route.rpc("search", {args: client.args}, function(err, data) {
            if(err) throw err;
            showSearchResults(client, results);
        });
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
