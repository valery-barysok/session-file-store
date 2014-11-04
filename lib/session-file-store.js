var fs = require('graceful-fs'),
  path = require('path'),
  retry = require("retry");

/**
 * One day in seconds
 */

var ONE_DAY = 24 * 60 * 60;

/**
 * https://github.com/expressjs/session#session-store-implementation
 *
 * @param {object} session  express session
 * @return {Function} the `FileStore` extending `express`'s session Store
 *
 * @api public
 */
module.exports = function (session) {
  var Store = session.Store;

  /**
   * Initialize FileStore with the given `options`
   *
   * @param {Object} options
   * @api public
   */
  function FileStore(options) {
    var self = this;

    options = options || {};
    Store.call(self, options);

    self.path = path.normalize(options.path || './sessions');
    self.ttl = options.ttl || 3600;
    self.retries = options.retries || 5;
    self.factor = options.factor || 1;
    self.minTimeout = options.minTimeout || 50;
    self.maxTimeout = options.maxTimeout || 100;

    self.filePattern = /\.json$/;

    // set default reapInterval to 1 hour
    self.reapInterval = (options.reapInterval * 1000) || 3600000;

    // interval for reaping old sessions
    if (self.reapInterval !== -1) {
      setInterval(function () {
        self.reap();
      }, self.reapInterval);
    }

    fs.mkdir(self.path, function (err) {
      if (err && err.code != 'EEXIST') throw err;
    });
  }

  /**
   * Inherit from Store
   */
  FileStore.prototype.__proto__ = Store.prototype;

  /**
   Delete sessions older than ttl / maxAge
   @api private
   */
  FileStore.prototype.reap = function () {
    console.log("[session-file-store] Deleteing expired sessions");
    var self = this;
    // get session list
    self.list(function (err, files) {
      // no error, continue
      if (err == null) {
        function destroyIfExpired(sessionId) {
          //and check if its expired
          self.expired(sessionId, function (err, expired) {
            if (err == null && expired) {
              self.destroy(sessionId, null);
            }
          });
        }

        for (var i = 0; i < files.length; i++) {
          // get the session id from filename
          destroyIfExpired(files[i].substring(0, files[i].lastIndexOf('.json')));
        }
      }
    });
  };


  /**
   * Attempts to fetch session from a session file by the given `sessionId`
   *
   * @param  {String}   sessionId
   * @param  {Function} callback
   *
   * @api public
   */
  FileStore.prototype.get = function (sessionId, callback) {
    var self = this;

    var sessionPath = path.join(this.path, sessionId + '.json'),
      json;

    var operation = retry.operation({
      retries: self.retries,
      factor: self.factor,
      minTimeout: self.minTimeout,
      maxTimeout: self.maxTimeout
    });

    operation.attempt(function (currentAttempt) {
      fs.readFile(sessionPath, 'utf8', function (err, data) {
        if (err) return callback(err);

        try {
          json = JSON.parse(data);
        } catch (err) {
          if (operation.retry(err)) {
            console.log("[retry] will retry, error on last attempt: " + err);
            return;
          }
          return callback(err);
        }

        callback(null, json);
      });
    });
  };

  /**
   * Attempts to commit the given session associated with the given `sessionId` to a session file
   *
   * @param {String}   sessionId
   * @param {Object}   session
   * @param {Function} callback   optional
   *
   * @api public
   */
  FileStore.prototype.set = function (sessionId, session, callback) {
    var self = this;

    try {
      session.__lastAccess = new Date().getTime();
      session = JSON.stringify(session);

      fs.writeFile(path.join(self.path, sessionId + '.json'), session, function (err) {
        callback && err ? callback(err) : callback(null, JSON.parse(session));
      });
    } catch (err) {
      callback && callback(err);
    }
  };

  /**
   * Attempts to unlink a given session by its id
   *
   * @param  {String}   sessionId   Files are serialized to disk by their
   *                                sessionId
   * @param  {Function} callback
   *
   * @api public
   */
  FileStore.prototype.destroy = function (sessionId, callback) {
    fs.unlink(path.join(this.path, sessionId + '.json'), function (err) {
      if (callback) callback(err);
    });
  };

  /**
   * Attempts to fetch number of the session files
   *
   * @param  {Function} callback
   *
   * @api public
   */
  FileStore.prototype.length = function (callback) {
    var self = this;

    fs.readdir(self.path, function (err, files) {
      if (err) return callback(err);

      var result = 0;
      files.forEach(function (file) {
        if (self.filePattern.exec(file)) {
          ++result;
        }
      });

      callback(null, result);
    });
  };

  /**
   * Attempts to clear out all of the existing session files
   *
   * @param  {Function} callback
   *
   * @api public
   */
  FileStore.prototype.clear = function (callback) {
    var self = this,
      filePath;

    fs.readdir(self.path, function (err, files) {
      if (files.length <= 0) return callback();

      var errors = [];
      files.forEach(function (file, i) {
        filePath = path.join(self.path, file);

        if (self.filePattern.exec(file)) {
          fs.unlink(filePath, function (err) {
            if (err) {
              errors.push(err);
            }
            if (i >= files.length - 1) {
              callback(errors.length > 0 ? errors : undefined);
            }
          });
        } else {
          if (i >= files.length - 1) {
            callback(errors.length > 0 ? errors : undefined);
          }
        }
      });
    });
  };

  /**
   * Attempts to find all of the session files
   *
   * @param  {Function} callback
   *
   * @api public
   */
  FileStore.prototype.list = function (callback) {
    var self = this;

    fs.readdir(self.path, function (err, files) {
      if (err) return callback(err);

      var sessionFiles = files.filter(function (file) {
        return self.filePattern.exec(file);
      });

      callback(null, sessionFiles);
    });
  };

  /**
   * Attempts to detect whether a session file is already expired or not
   *
   * @param  {String}   sessionId
   * @param  {Function} callback
   *
   * @api public
   */
  FileStore.prototype.expired = function (sessionId, callback) {
    var self = this,
      now = new Date().getTime();
    self.get(sessionId, function (err, session) {
      if (err) return callback(err);

      var maxAge = session.cookie.maxAge,
        ttl = self.ttl || ('number' == typeof maxAge
            ? maxAge / 1000 | 0
            : ONE_DAY);

      err ? callback(err) : callback(null, session.__lastAccess + ttl < now);
    });
  };

  return FileStore;
};
