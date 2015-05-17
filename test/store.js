var helpers = require('../lib/session-file-helpers'),
  chai = require('chai'),
  expect = chai.expect,
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

      describe("#length", function () {

        describe('no destination folder exists', function () {

          it('should fails when no folder exists', function (done) {
            store.length(function (err, result) {
              expect(err)
                .to.be.ok
                .and.is.an('object')
                .and.have.property('code', 'ENOENT');
              expect(result).to.not.exist;
              done();
            });
          });
        });

        describe('destination folder is empty', function () {

          before(function (done) {
            fs.emptyDir(SESSIONS_OPTIONS.path, done);
          });

          after(function (done) {
            fs.remove(SESSIONS_OPTIONS.path, done);
          });

          it('should returns 0 when empty folder exists', function (done) {
            store.length(function (err, result) {
              expect(err).to.not.exist;
              expect(result).to.equal(0);
              done();
            });
          });
        });
      });
    });
  });
});