var helpers = require('../lib/session-file-helpers'),
  chai = require('chai'),
  expect = chai.expect,
  fs = require('fs-extra'),
  os = require('os'),
  path = require('path'),
  clone = require('lodash.clone');

describe('helpers', function () {
  var FIXTURE_SESSIONS_PATH = path.normalize('test/fixtures/sessions');
  var FIXTURE_SESSIONS_NO_EXIST_PATH = path.normalize('test/fixtures/sessions_no_exist');
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
  var OPTIONS = helpers.defaults({
    logFn: NOOP_FN
  });
  var SESSIONS_OPTIONS = helpers.defaults({
    path: SESSIONS_PATH,
    logFn: NOOP_FN
  });
  var FIXTURE_SESSIONS_OPTIONS = helpers.defaults({
    path: FIXTURE_SESSIONS_PATH,
    logFn: NOOP_FN
  });
  var FIXTURE_SESSIONS_NO_EXIST_OPTIONS = helpers.defaults({
    path: FIXTURE_SESSIONS_NO_EXIST_PATH,
    logFn: NOOP_FN
  });
  var FALLBACK_OPTIONS = helpers.defaults({
    path: FIXTURE_SESSIONS_NO_EXIST_PATH,
    logFn: NOOP_FN,
    fallbackSessionFn: function () {
      return clone(SESSION);
    }
  });

  describe('#defaults', function () {
    it('should returns valid defaults', function () {
      var options = OPTIONS;
      expect(options).to.exist;
      expect(options).to.have.property('path').that.is.a('string');
      expect(options).to.have.property('ttl').that.be.a('number');
      expect(options).to.have.property('retries').that.be.a('number').and.least(0);
      expect(options).to.have.property('factor').that.be.a('number').and.gt(0);
      expect(options).to.have.property('minTimeout').that.be.a('number').and.gt(0);
      expect(options).to.have.property('maxTimeout').that.be.a('number').and.least(options.minTimeout);
      expect(options).to.have.property('filePattern').that.is.instanceOf(RegExp);
      expect(options).to.have.property('reapInterval').that.be.a('number');
      expect(options).to.have.property('reapAsync').that.be.a('boolean');
      expect(options).to.have.property('reapSyncFallback').that.be.a('boolean');
      expect(options).to.have.property('logFn').that.be.a('function');
      expect(options).to.have.property('fallbackSessionFn').that.be.a('undefined');
    });
  });

  describe('#sessionId', function () {
    it('should returns session id when valid json file name is passed', function () {
      var sessionId = helpers.sessionId('id.json');
      expect(sessionId).is.equal('id');
    });

    it('should returns no session id when invalid file name is passed', function () {
      var sessionId = helpers.sessionId('id');
      expect(sessionId).is.equal('');
    });
  });

  describe('#sessionPath', function () {
    it('should returns session file path when base path and session id are passed', function () {
      var sessionPath = helpers.sessionPath(OPTIONS.path, 'id');
      expect(sessionPath).to.be.a('string').and.is.equal(path.normalize('sessions/id.json'));
    });
  });

  describe('#length', function () {

    describe('no destination folder exists', function () {

      it('should fails when no folder exists', function (done) {
        helpers.length(FIXTURE_SESSIONS_NO_EXIST_OPTIONS, function (err, result) {
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
        helpers.length(SESSIONS_OPTIONS, function (err, result) {
          expect(err).to.not.exist;
          expect(result).to.equal(0);
          done();
        });
      });
    });

    describe('destination folder has some session files', function () {

      it('should returns count of session files match to file pattern', function (done) {
        helpers.length(FIXTURE_SESSIONS_OPTIONS, function (err, result) {
          expect(err).to.not.exist;
          expect(result).to.equal(2);
          done();
        });
      });
    });
  });

  describe('#list', function () {

    describe('no destination folder exists', function () {

      it('should fails when no folder exists', function (done) {
        helpers.list(FIXTURE_SESSIONS_NO_EXIST_OPTIONS, function (err, result) {
          expect(err)
            .to.be.ok
            .and.is.an('object')
            .and.have.property('code', 'ENOENT');
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

      it('should returns empty list when empty folder exists', function (done) {
        helpers.list(SESSIONS_OPTIONS, function (err, files) {
          expect(err).to.not.exist;
          expect(files).is.empty;
          done();
        });
      });
    });

    describe('destination folder has some session files', function () {

      it('should returns session files match to file pattern', function (done) {
        helpers.list(FIXTURE_SESSIONS_OPTIONS, function (err, files) {
          expect(err).to.not.exist;
          expect(files).to.have.length(2);
          done();
        });
      });
    });
  });

  describe('#get', function () {

    it('should fails when no session file exists', function (done) {
      helpers.get('no_exists', FIXTURE_SESSIONS_OPTIONS, function (err, json) {
        expect(err)
          .to.be.ok
          .and.is.an('object')
          .and.have.property('code', 'ENOENT');
        expect(json).to.not.exist;
        done();
      });
    });

    it('should fails when invalid session file exists', function (done) {
      helpers.get('2o7sOpgMqMGWem0IxddjE0DkR3-jqUPS', FIXTURE_SESSIONS_OPTIONS, function (err, json) {
        expect(err)
          .to.be.ok
          .and.is.an('object')
          .and.have.property('code', 'ENOENT');
        expect(json).to.not.exist;
        done();
      });
    });

    it('should succeeds when valid session file exists', function (done) {
      helpers.get('2o7sOpgMqMGWem0IxddjE0DkR3-jqUPx', FIXTURE_SESSIONS_OPTIONS, function (err, json) {
        expect(err).to.not.exist;
        expect(json).to.be.ok;
        done();
      });
    });

    it('should succeeds with fallbackSessionFn when session file does not exist', function (done) {
      helpers.get('2o7sOpgMqMGWem0IxddjE0DkR3-jqUPx', FALLBACK_OPTIONS, function (err, json) {
        expect(err).to.not.exist;
        expect(json).to.be.ok;
        done();
      });
    });
  });

  describe('#set', function () {

    before(function (done) {
      fs.emptyDir(SESSIONS_OPTIONS.path, done);
    });

    after(function (done) {
      fs.remove(SESSIONS_OPTIONS.path, done);
    });

    it('should creates new session file', function (done) {
      var session = clone(SESSION);
      session.__lastAccess = 0;
      helpers.set(SESSION_ID, session, SESSIONS_OPTIONS, function (err, json) {
        expect(err).to.not.exist;
        expect(json).to.have.property('__lastAccess');
        expect(json.__lastAccess).to.not.equal(SESSION.__lastAccess);
        done();
      });
    });
  });

  describe('#destroy', function () {
    var SESSION_FILE = path.join(SESSIONS_OPTIONS.path, SESSION_ID + '.json');

    before(function (done) {
      fs.emptyDir(SESSIONS_OPTIONS.path, function () {
        fs.writeJson(SESSION_FILE, SESSION, done);
      });
    });

    after(function (done) {
      fs.remove(SESSIONS_OPTIONS.path, done);
    });

    it('should destroys session file', function (done) {
      helpers.destroy(SESSION_ID, SESSIONS_OPTIONS, function (err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('#clear', function () {
    var SESSION_FILE = path.join(SESSIONS_OPTIONS.path, SESSION_ID + '.json');

    before(function (done) {
      fs.emptyDir(SESSIONS_OPTIONS.path, function () {
        fs.writeJson(SESSION_FILE, SESSION, done);
      });
    });

    after(function (done) {
      fs.remove(SESSIONS_OPTIONS.path, done);
    });

    it('should destroys session file', function (done) {
      helpers.clear(SESSIONS_OPTIONS, function (err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('#expired', function () {
    var EXPIRED_SESSION_ID = 'expired_' + SESSION_ID;
    var EXPIRED_SESSION_FILE = path.join(SESSIONS_OPTIONS.path, EXPIRED_SESSION_ID + '.json');
    var expiredSession = clone(SESSION);
    expiredSession.__lastAccess = 0;

    var SESSION_FILE = path.join(SESSIONS_OPTIONS.path, SESSION_ID + '.json');
    var session = clone(SESSION);
    session.__lastAccess = new Date().getTime();

    before(function (done) {
      fs.emptyDir(SESSIONS_OPTIONS.path, function () {
        fs.writeJson(EXPIRED_SESSION_FILE, expiredSession, function () {
          fs.writeJson(SESSION_FILE, session, done);
        });
      });
    });

    after(function (done) {
      fs.remove(SESSIONS_OPTIONS.path, done);
    });

    it('should be expired', function (done) {
      helpers.expired(EXPIRED_SESSION_ID, SESSIONS_OPTIONS, function (err, expired) {
        expect(err).to.not.exist;
        expect(expired).to.be.true;
        done();
      });
    });

    it('should not be expired', function (done) {
      helpers.expired(SESSION_ID, SESSIONS_OPTIONS, function (err, expired) {
        expect(err).to.not.exist;
        expect(expired).to.be.false;
        done();
      });
    });
  });

  describe('#destroyIfExpired', function () {
    var EXPIRED_SESSION_ID = 'expired_' + SESSION_ID;
    var EXPIRED_SESSION_FILE = path.join(SESSIONS_OPTIONS.path, EXPIRED_SESSION_ID + '.json');
    var expiredSession = clone(SESSION);
    expiredSession.__lastAccess = 0;

    var SESSION_FILE = path.join(SESSIONS_OPTIONS.path, SESSION_ID + '.json');
    var session = clone(SESSION);
    session.__lastAccess = new Date().getTime();

    before(function (done) {
      fs.emptyDir(SESSIONS_OPTIONS.path, function () {
        fs.writeJson(EXPIRED_SESSION_FILE, expiredSession, function () {
          fs.writeJson(SESSION_FILE, session, done);
        });
      });
    });

    after(function (done) {
      fs.remove(SESSIONS_OPTIONS.path, done);
    });

    it('should be succeed', function (done) {
      helpers.destroyIfExpired(SESSION_ID, SESSIONS_OPTIONS, function (err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });
});
