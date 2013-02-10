require("qp")(global);

function search(client) {
    client.json(client);
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
