require("./qp")(global);

function search(client) {
    client.done();
}

function bibentry(client) {
    client.done();
}

qp.route.add("search", search);
qp.route.add("entry", bibentry);
