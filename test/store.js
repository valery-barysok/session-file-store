var helpers = require('../lib/session-file-helpers'),
  fs = require('fs-extra'),
  os = require('os'),
  path = require('path');

var session = function () {
};
session.Store = function () {
};
var FileStore = require('../lib/session-file-store')(session);

describe('store', function () {
  var SESSIONS_PATH = path.join(os.tmpdir(), 'sessions');

  var NOOP_FN = function () {
  };
  var SESSIONS_OPTIONS = helpers.defaults({
    path: SESSIONS_PATH,
    logFn: NOOP_FN
  });

  describe('#constructor', function () {

    before(function (done) {
      fs.remove(SESSIONS_OPTIONS.path, done);
    });

    after(function (done) {
      fs.remove(SESSIONS_OPTIONS.path, done);
    });

    it('should construct', function () {
      var store = new FileStore(SESSIONS_OPTIONS);
    });
  });
});
