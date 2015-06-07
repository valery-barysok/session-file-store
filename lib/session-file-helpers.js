var fs = require('fs-extra'),
  path = require('path'),
  retry = require('retry'),
  childProcess = require('child_process');

var helpers = {

  sessionPath: function (basepath, sessionId) {
    return path.join(basepath, sessionId + '.json');
  },

  sessionId: function (file) {
    return file.substring(0, file.lastIndexOf('.json'));
  },

  defaults: function (options) {
    options = options || {};

    return {
      path: path.normalize(options.path || './sessions'),
      ttl: options.ttl || 3600,
      retries: options.retries || 5,
      factor: options.factor || 1,
      minTimeout: options.minTimeout || 50,
      maxTimeout: options.maxTimeout || 100,
      filePattern: /\.json$/,
      reapInterval: options.reapInterval || 3600,
      reapAsync: options.reapAsync || false,
      reapSyncFallback: options.reapSyncFallback || false,
      logFn: options.logFn || console.log,
      fallbackSessionFn: options.fallbackSessionFn
    };
  },

  destroyIfExpired: function (sessionId, options, callback) {
    helpers.expired(sessionId, options, function (err, expired) {
      if (err == null && expired) {
        helpers.destroy(sessionId, options, callback);
      } else if (callback) {
        err ? callback(err) : callback();
      }
    });
  },

  scheduleReap: function (options) {
    if (options.reapInterval !== -1) {
      setInterval(function () {
        if (options.reapAsync) {
          options.logFn('[session-file-store] Starting reap worker thread');
          helpers.asyncReap(options);
        } else {
          options.logFn('[session-file-store] Deleting expired sessions');
          helpers.reap(options);
        }
      }, options.reapInterval * 1000);
    }
  },

  asyncReap: function (options, callback) {
    callback || (callback = function () {
    });
    childProcess.execFile(path.join(__dirname, 'reap-worker.js'), [options.path, options.ttl], function (err) {
      if (err && options.reapSyncFallback) {
        helpers.reap(options, callback);
      } else {
        err ? callback(err) : callback();
      }
    });
  },

  reap: function (options, callback) {
    callback || (callback = function () {
    });
    helpers.list(options, function (err, files) {
      if (err) return callback(err);
      if (files.length === 0) return callback();

      var errors = [];
      files.forEach(function (file, i) {
        helpers.destroyIfExpired(helpers.sessionId(file), options, function (err) {
          if (err) {
            errors.push(err);
          }
          if (i >= files.length - 1) {
            errors.length > 0 ? callback(errors) : callback();
          }
        });
      });
    });
  },

  /**
   * Attempts to fetch session from a session file by the given `sessionId`
   *
   * @param  {String}   sessionId
   * @param  {Object}   options
   * @param  {Function} callback
   *
   * @api public
   */
  get: function (sessionId, options, callback) {
    var sessionPath = helpers.sessionPath(options.path, sessionId);

    var operation = retry.operation({
      retries: options.retries,
      factor: options.factor,
      minTimeout: options.minTimeout,
      maxTimeout: options.maxTimeout
    });

    operation.attempt(function () {
      fs.readJson(sessionPath, 'utf8', function (err, json) {
        if (!err) return callback(null, json);

        if (operation.retry(err)) {
          options.logFn('[session-file-store] will retry, error on last attempt: ' + err);
        } else if (options.fallbackSessionFn) {
          var session = options.fallbackSessionFn();
          session.__lastAccess = new Date().getTime();
          callback(null, session);
        } else {
          callback(err);
        }
      });
    });
  },

  /**
   * Attempts to commit the given `session` associated with the given `sessionId` to a session file
   *
   * @param {String}   sessionId
   * @param {Object}   session
   * @param  {Object}  options
   * @param {Function} callback (optional)
   *
   * @api public
   */
  set: function (sessionId, session, options, callback) {
    try {
      session.__lastAccess = new Date().getTime();

      var sessionPath = helpers.sessionPath(options.path, sessionId);
      fs.writeJson(sessionPath, session, function (err) {
        if (callback) {
          err ? callback(err) : callback(null, session);
        }
      });
    } catch (err) {
      if (callback) callback(err);
    }
  },

  /**
   * Attempts to unlink a given session by its id
   *
   * @param  {String}   sessionId   Files are serialized to disk by their sessionId
   * @param  {Object}   options
   * @param  {Function} callback
   *
   * @api public
   */
  destroy: function (sessionId, options, callback) {
    var sessionPath = helpers.sessionPath(options.path, sessionId);
    fs.remove(sessionPath, callback);
  },

  /**
   * Attempts to fetch number of the session files
   *
   * @param  {Object}   options
   * @param  {Function} callback
   *
   * @api public
   */
  length: function (options, callback) {
    fs.readdir(options.path, function (err, files) {
      if (err) return callback(err);

      var result = 0;
      files.forEach(function (file) {
        if (options.filePattern.exec(file)) {
          ++result;
        }
      });

      callback(null, result);
    });
  },

  /**
   * Attempts to clear out all of the existing session files
   *
   * @param  {Object}   options
   * @param  {Function} callback
   *
   * @api public
   */
  clear: function (options, callback) {
    fs.readdir(options.path, function (err, files) {
      if (err) return callback([err]);
      if (files.length <= 0) return callback();

      var errors = [];
      files.forEach(function (file, i) {
        if (options.filePattern.exec(file)) {
          fs.remove(path.join(options.path, file), function (err) {
            if (err) {
              errors.push(err);
            }
            // TODO: wrong call condition (call after all completed attempts to remove instead of completed attempt with last index)
            if (i >= files.length - 1) {
              errors.length > 0 ? callback(errors) : callback();
            }
          });
        } else {
          // TODO: wrong call condition (call after all completed attempts to remove instead of completed attempt with last index)
          if (i >= files.length - 1) {
            errors.length > 0 ? callback(errors) : callback();
          }
        }
      });
    });
  },

  /**
   * Attempts to find all of the session files
   *
   * @param  {Object}   options
   * @param  {Function} callback
   *
   * @api public
   */
  list: function (options, callback) {
    fs.readdir(options.path, function (err, files) {
      if (err) return callback(err);

      files = files.filter(function (file) {
        return options.filePattern.exec(file);
      });

      callback(null, files);
    });
  },

  /**
   * Attempts to detect whether a session file is already expired or not
   *
   * @param  {String}   sessionId
   * @param  {Object}   options
   * @param  {Function} callback
   *
   * @api public
   */
  expired: function (sessionId, options, callback) {
    helpers.get(sessionId, options, function (err, session) {
      if (err) return callback(err);

      var ttl = options.ttl * 1000;
      if (!ttl) {
        var maxAge = session.cookie ? session.cookie.maxAge : undefined;
        ttl = 'number' === typeof maxAge ? maxAge : 24 * 60 * 60 * 1000;
      }

      err ? callback(err) : callback(null, session.__lastAccess + ttl < new Date().getTime());
    });
  }
};

module.exports = helpers;