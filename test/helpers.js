var helpers = require('../lib/session-file-helpers'),
  chai = require('chai'),
  expect = chai.expect,
  fs = require('graceful-fs'),
  path = require('path');

describe('helpers', function () {

  describe('#defaults', function () {
    it('should return valid defaults', function () {
      var options = helpers.defaults();
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
    });
  });

  describe('#sessionId', function () {
    it('should return session id when valid json file name is passed', function () {
      var sessionId = helpers.sessionId('id.json');
      expect(sessionId).is.equal('id');
    });

    it('should return no session id when invalid file name is passed', function () {
      var sessionId = helpers.sessionId('id');
      expect(sessionId).is.equal('');
    });
  });

  describe('#sessionPath', function () {
    it('should return session file path when base path and session id are passed', function () {
      var sessionPath = helpers.sessionPath(helpers.defaults().path, 'id');
      expect(sessionPath).to.be.a('string')
        .and.is.equal(path.normalize('sessions/id.json'));
    });
  });

  describe('#length', function () {

    describe('no destination folder exists', function () {
      var options = helpers.defaults({
        path: path.normalize('fixtures/sessions_no_exists')
      });

      it('should failed when no folder exists', function (done) {
        helpers.length(options, function (err, result) {
          expect(err)
            .to.be.ok
            .and.is.an('object')
            .and.have.property('code', 'ENOENT');
          done();
        });
      });
    });

    describe('destination folder is empty', function () {
      var options = helpers.defaults({
        path: path.normalize('fixtures/empty_sessions')
      });

      before(function () {
        fs.mkdirSync(options.path, '0755');
      });

      after(function () {
        fs.rmdirSync(options.path, '0755');
      });

      it('should return 0 when empty folder exists', function (done) {
        helpers.length(options, function (err, result) {
          expect(err).to.not.exist;
          expect(result).to.equal(0);
          done();
        });
      });
    });

    describe('destination folder has some session files', function () {
      var options = helpers.defaults({
        path: path.normalize('fixtures/sessions')
      });

      it('should return count of session files match to file pattern', function (done) {
        helpers.length(options, function (err, result) {
          expect(err).to.not.exist;
          expect(result).to.equal(2);
          done();
        });
      });
    });
  });

  describe('#list', function () {

    describe('no destination folder exists', function () {
      var options = helpers.defaults({
        path: path.normalize('fixtures/sessions_no_exists')
      });

      it('should failed when no folder exists', function (done) {
        helpers.list(options, function (err, result) {
          expect(err)
            .to.be.ok
            .and.is.an('object')
            .and.have.property('code', 'ENOENT');
          done();
        });
      });
    });

    describe('destination folder is empty', function () {
      var options = helpers.defaults({
        path: path.normalize('fixtures/empty_sessions')
      });

      before(function () {
        fs.mkdirSync(options.path, '0755');
      });

      after(function () {
        fs.rmdirSync(options.path, '0755');
      });

      it('should return empty list when empty folder exists', function (done) {
        helpers.list(options, function (err, files) {
          expect(err).to.not.exist;
          expect(files).is.empty;
          done();
        });
      });
    });

    describe('destination folder has some session files', function () {
      var options = helpers.defaults({
        path: path.normalize('fixtures/sessions')
      });

      it('should return session files match to file pattern', function (done) {
        helpers.list(options, function (err, files) {
          expect(err).to.not.exist;
          expect(files).to.have.length(2);
          done();
        });
      });
    });
  });
});
