var fs = require('fs-extra');
var path = require('path');
var retry = require('retry');
var childProcess = require('child_process');
var Bagpipe = require('bagpipe');
var isWindows = process.platform === 'win32';

var helpers = {

  sessionPath: function (basepath, sessionId) {
    return path.join(basepath, sessionId + '.json');
  },

  sessionId: function (file) {
    return file.substring(0, file.lastIndexOf('.json'));
  },

  getLastAccess: function (session) {
    return session.__lastAccess;
  },

  setLastAccess: function (session) {
    session.__lastAccess = new Date().getTime();
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
      reapMaxConcurrent: options.reapMaxConcurrent || 10,
      reapAsync: options.reapAsync || false,
      reapSyncFallback: options.reapSyncFallback || false,
      logFn: options.logFn || console.log,
      emitter: options.emitter,
      fallbackSessionFn: options.fallbackSessionFn
    };
  },

  destroyIfExpired: function (sessionId, options, callback) {
    helpers.expired(sessionId, options, function (err, expired) {
      if (err == null && expired) {
        if(options.expireCallback) {
          var sessionPath = helpers.sessionPath(options.path, sessionId);
          fs.readJson(sessionPath, 'utf8', function (err, json) {
            if (!err) {
              json.sessionId = sessionId;
              return options.expireCallback(null, json);
            }
            return options.expireCallback(err);
          });
        }
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
          options.logFn({type: 'info', message: '[session-file-store] Starting reap worker thread'});
          helpers.asyncReap(options);
        } else {
          options.logFn({type: 'info', message: '[session-file-store] Deleting expired sessions'});
          helpers.reap(options);
        }
      }, options.reapInterval * 1000);
    }
  },

  asyncReap: function (options, callback) {
    callback || (callback = function () {
    });

    function execCallback(err) {
      if (err && options.reapSyncFallback) {
        helpers.reap(options, callback);
      } else {
        err ? callback(err) : callback();
      }
    }

    if (isWindows) {
      childProcess.execFile('node', [path.join(__dirname, 'reap-worker.js'), options.path, options.ttl], execCallback);
    } else {
      childProcess.execFile(path.join(__dirname, 'reap-worker.js'), [options.path, options.ttl], execCallback);
    }
  },

  reap: function (options, callback) {
    callback || (callback = function () {
    });
    helpers.list(options, function (err, files) {
      if (err) return callback(err);
      if (files.length === 0) return callback();

      var bagpipe = new Bagpipe(options.reapMaxConcurrent);

      var errors = [];
      files.forEach(function (file, i) {
        bagpipe.push(helpers.destroyIfExpired,
            helpers.sessionId(file),
            options,
            function (err) {
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
        if (!err) return callback(null, helpers.isExpired(json, options, sessionId) ? null : json);

        if (operation.retry(err)) {
          options.logFn({type: 'error', message: '[session-file-store] will retry, error on last attempt' + err});
        } else if (options.fallbackSessionFn) {
          var session = options.fallbackSessionFn();
          helpers.setLastAccess(session);
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
      helpers.setLastAccess(session);
      helpers.write(sessionId, session, options, callback);
  },

  /**
   * Writes the given `session` associated with the given `sessionId` to a session file
   *
   * @param {String}   sessionId
   * @param {Object}   session
   * @param  {Object}  options
   * @param {Function} callback (optional)
   *
   * @api public
   */
  write: function (sessionId, session, options, callback) {
    try {
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

      err ? callback(err) : callback(null, helpers.isExpired(session, options, sessionId));
    });
  },

  isExpired: function (session, options, sessionId) {
    if (!session) return true;

    var ttl = session.cookie && session.cookie.originalMaxAge ? session.cookie.originalMaxAge : options.ttl * 1000;
    var expired = !ttl || helpers.getLastAccess(session) + ttl < new Date().getTime();
    if (expired && !session.expireEmitted) {
      session.sessionId = sessionId;
      options.emitter.emit('sessionExpired', session);
      session.expireEmitted = true;
      helpers.write(sessionId, session, options, function (err) {
        if (err)
          options.logFn('Error setting expired session'); // todo use new method for reporting errors
      });
    }
    return expired;
  }
};

module.exports = helpers;
