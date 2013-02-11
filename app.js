require("qp")(global);

var ws = {};

ws.search = function(query, first, callback) {
    qp.sys.read("http://opensearch.addi.dk/2.2/", {
        "post": {"xml": qp.jsonml.toString(
            ["soap:Envelope",
                {   "xmlns:soap":"http://schemas.xmlsoap.org/soap/envelope/",
                    xmlns:"http://oss.dbc.dk/ns/opensearch"},
                ["soap:Body", ["searchRequest",
                    ["query", query],
                    ["agency", "100200"],
                    ["profile", "test"],
                    ["start", (first || 0) +1],
                    ["callback", "callback"],
                    ["stepValue", "10"]]]])}
    }, function(err, data, opt) {
        if(err) return callback(err);
        callback(null, qp.jsonml.fromString(data), {});
    });
};

function search(client) {
    console.log(client);
    ws.search("query", 0, function(err, result) {
        client.jsonml(JSON.stringify(result[0][2][2][2]));
    });
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
