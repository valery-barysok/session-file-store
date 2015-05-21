var koa = require('koa');
var app = koa();
var session = require('express-session');
var FileStore = require('session-file-store')(session);

var middleware = session({
  store: new FileStore,
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
});

app.use(function *(next) {
  yield middleware.bind(null, this.req, this.res);
  yield next;
});

app.use(function *(next) {
  if (this.method !== 'GET' || this.path !== '/') return yield next;

  if (this.req.session.views) {
    this.req.session.views++;
    this.body = '<p>views: ' + this.req.session.views + '</p>';
  } else {
    this.req.session.views = 1;
    this.body = 'Welcome to the file session demo. Refresh page!';
  }
});

var server = app.listen(1337, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
