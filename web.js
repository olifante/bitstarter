/*jslint node: true, indent: 2, vars: true */
"use strict";

var express = require('express');
var fs = require('fs');

var app = express.createServer(express.logger());

app.get('/', function (request, response) {
  var fileBuffer = fs.readFileSync('index.html');
  var str = fileBuffer.toString();
  response.send(str);
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Listening on " + port);
});
