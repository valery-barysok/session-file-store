var session = function () {
};
session.Store = function () {
};
var FileStore = require('../lib/session-file-store')(session);

describe('store', function () {

  describe('#constructor', function () {

    it('should construct', function () {
      var store = new FileStore({});
    });
  });
});
