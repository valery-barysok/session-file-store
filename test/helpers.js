var helpers = require('../lib/session-file-helpers'),
  chai = require('chai'),
  expect = chai.expect,
  fs = require('graceful-fs'),
  path = require('path');

describe('helpers', function () {
  var options = helpers.defaults();

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
      expect(options).to.have.property('reapWorker').that.be.a('boolean');
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
      var sessionPath = helpers.sessionPath(options.path, 'id');
      expect(sessionPath).to.be.a('string')
        .and.is.equal(path.normalize('sessions/id.json'));
    });
  });

  describe('#length', function () {

    describe('no destination folder exists', function () {

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

      before(function () {
        fs.mkdirSync(options.path);
      });

      after(function () {
        fs.rmdirSync(options.path);
      });

      it('should return 0 when empty folder exists', function (done) {
        helpers.length(options, function (err, result) {
          expect(err).to.not.exist;
          expect(result).to.equal(0);
          done();
        });
      });
    });

    describe('destination folder has some files', function () {

      before(function () {
        fs.mkdirSync(options.path);

        fs.closeSync(fs.openSync(path.join(options.path, '1.json'), 'w'));
        fs.closeSync(fs.openSync(path.join(options.path, '2.json'), 'w'));
        fs.closeSync(fs.openSync(path.join(options.path, '3.notjson'), 'w'));
      });

      after(function () {
        fs.unlinkSync(path.join(options.path, '1.json'));
        fs.unlinkSync(path.join(options.path, '2.json'));
        fs.unlinkSync(path.join(options.path, '3.notjson'));

        fs.rmdirSync(options.path);
      });

      it('should return count of files match to file pattern', function (done) {
        helpers.length(options, function (err, result) {
          expect(err).to.not.exist;
          expect(result).to.equal(2);
          done();
        });
      });
    });
  });
});
