var helpers = require('../lib/session-file-helpers');
var chai = require('chai');
var expect = chai.expect;
var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var childProcess = require('child_process');
var clone = require('lodash.clone');
var isWindows = process.platform === 'win32';

describe('reap', function () {
  var SESSIONS_PATH = path.join(os.tmpdir(), 'sessions');
  var SESSION_ID = 'session_id';
  var SESSION = {
    cookie: {
      originalMaxAge: null,
      expires: null,
      httpOnly: true,
      path: '/'
    },
    views: 9,
    __lastAccess: 1430336255633
  };

  var NOOP_FN = function () {
  };
  var SESSIONS_OPTIONS = helpers.defaults({
    path: SESSIONS_PATH,
    logFn: NOOP_FN
  });

  var EXPIRED_SESSION_ID = 'expired_' + SESSION_ID;
  var EXPIRED_SESSION_FILE = path.join(SESSIONS_OPTIONS.path, EXPIRED_SESSION_ID + '.json');
  var expiredSession = clone(SESSION);
  expiredSession.__lastAccess = 0;

  var SESSION_FILE = path.join(SESSIONS_OPTIONS.path, SESSION_ID + '.json');
  var session = clone(SESSION);
  session.__lastAccess = new Date().getTime();

  beforeEach(function (done) {
    fs.emptyDir(SESSIONS_OPTIONS.path, function () {
      fs.writeJson(EXPIRED_SESSION_FILE, expiredSession, function () {
        fs.writeJson(SESSION_FILE, session, done);
      });
    });
  });

  afterEach(function (done) {
    fs.remove(SESSIONS_OPTIONS.path, done);
  });

  it('should removes stale session file', function (done) {
    helpers.reap(SESSIONS_OPTIONS, function (err) {
      expect(err).to.not.exist;
      done();
    });
  });

  it('should removes stale session file using distinct process', function (done) {
    function asyncReap() {
      helpers.asyncReap(SESSIONS_OPTIONS, function () {
        fs.stat(EXPIRED_SESSION_FILE, function (err) {
          expect(err).to.exist;
          done();
        });
      });
    }

    if (isWindows) {
      asyncReap();
    } else {
      childProcess.exec('chmod +x ./reap-worker.js', {
        cwd: path.join(process.cwd(), 'lib')
      }, function (err) {
        if (!err) {
          asyncReap();
        }
      });
    }
  });
});
