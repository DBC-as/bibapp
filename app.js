require("qp")(global);

function search(client) {
    client.json(client);
}

function bibentry(client) {
    client.json(client);
}

qp.route.add("search", search);
qp.route.add("entry", bibentry);
