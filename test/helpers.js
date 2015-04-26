var helpers = require('../lib/session-file-helpers'),
  chai = require('chai'),
  expect = chai.expect,
  fs = require('graceful-fs'),
  path = require('path');

describe("helpers", function () {
  var options = helpers.defaults();
  options.path = path.join('test', options.path);

  describe("#sessionId", function () {
    it("should return session id when file name is passed", function () {
      var sessionId = helpers.sessionId("id.json");
      expect(sessionId).to.be.a("string");
      expect(sessionId).is.equal("id");
    });
  });

  describe("#sessionPath", function () {
    it("should return session file path when base path and session id are passed", function () {
      var sessionPath = helpers.sessionPath(options.path, "id");
      expect(sessionPath).to.be.a("string");
      expect(sessionPath).is.equal(path.normalize("test/sessions/id.json"));
    });
  });
});
