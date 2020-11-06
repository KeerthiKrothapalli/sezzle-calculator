"use strict";
var express = require('express');
var webSocketServer = require('websocket').server;
var http = require('http');
const path = require('path');
//List of chat history objects and clients 
var history = [];
var clients = [];

// Escape input strings 
function htmlEntities(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// random color will be assigned to the user 
var colors = ['#943126', '#5B2C6F', '#21618C', '#117A65', '#9A7D0A', '#4738C6', '#4738C6', '#20B2AA', '#808000', '#FA8072'];
colors.sort(function (a, b) { return Math.random() > 0.5; });

const PORT = process.env.PORT || 8081;
const INDEX = '/index.html';
const app = express();

const server = http.createServer({
}, app).listen(PORT, () => {
  console.log(`App running at ${PORT} `)
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res, next) {
  res.sendFile('public/index.html', { root: __dirname })
});

var wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', function (request) {
  console.log((new Date()) + ' Connection from origin '
    + request.origin + '.');
  // making sure that client is connecting from our website
  var connection = request.accept(null, request.origin);
  // get client index so that it will be easier to remove when disconnected
  var index = clients.push(connection) - 1;
  var userName = false;
  var userColor = false;
  console.log((new Date()) + ' Connection accepted.');
  if (history.length > 0) {
    connection.sendUTF(
      JSON.stringify({ type: 'history', data: history }));
  }

  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      // First message will always be the name of user 
      if (userName === false) {
        userName = htmlEntities(message.utf8Data);
        userColor = colors.shift();
        connection.sendUTF(
          JSON.stringify({ type: 'color', data: userColor }));
        console.log((new Date()) + ' User is known as: ' + userName
          + ' with ' + userColor + ' color.');
      } else {
        console.log((new Date()) + ' Received Message from '
          + userName + ': ' + message.utf8Data);

        var obj = {
          time: (new Date()).getTime(),
          text: htmlEntities(message.utf8Data),
          author: userName,
          color: userColor
        };
        history.push(obj);
        // Keep only last 10 messages
        history = history.slice(-10);
        // broadcast message to all connected clients
        var json = JSON.stringify({ type: 'message', data: obj });
        for (var i = 0; i < clients.length; i++) {
          if (history.length > 0) {
            clients[i].sendUTF(
              JSON.stringify({ type: 'history', data: history }));
          }

        }
      }
    }
  });

  connection.on('close', function (connection) {
    if (userName !== false && userColor !== false) {
      console.log((new Date()) + " Peer "
        + connection.remoteAddress + " disconnected.");
      clients.splice(index, 1);
      colors.push(userColor);
    }
  });
});