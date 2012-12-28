// Copyright 2012 Rasmus Erik
var express = require("express");
var app = express();
var server = require("http").createServer(app)
var io = require("socket.io").listen(server);

console.log(__dirname + "../client");
app.use("/", express.static(__dirname + "/../client"));

io.sockets.on("connection", function (socket) {
    socket.on("bar", function (data) {
        socket.emit("foo", {some: "obj"});
    });
});

var port = 8888;
server.listen(port);
console.log("started server on", port);
