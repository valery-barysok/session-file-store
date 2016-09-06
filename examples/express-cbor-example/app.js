var express = require('express');
var app = express();
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var cbor = require('cbor-sync');

app.use(session({
    store: new FileStore,
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    fileExtension: '.cbor',
    encoding: null,
    encoder: cbor.encode,
    decoder: cbor.decode
  })
);

app.get('/', function (req, res) {
  if (req.session.views) {
    req.session.views++;
    res.setHeader('Content-Type', 'text/html');
    res.write('<p>views: ' + req.session.views + '</p>');
    res.end();
  } else {
    req.session.views = 1;
    res.end('Welcome to the file session demo. Refresh page!');
  }
});

var server = app.listen(1337, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
