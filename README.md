# session-file-store

Session file store for [Express](http://expressjs.com/) and [Connect](https://github.com/senchalabs/connect).
Also you can use it with [Koa](http://koajs.com/)

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

Session file store is a provision for storing session data in the session file

## Compatibility

* Supports Express `>= 4.x` and Connect `>= 1.4.0` through [express-session][express-session-url]
* Supports [Node.js][node-url] `>= 4`
* Indirectly supports Koa `>= 0.9.0` through [express-session][express-session-url]

## Getting Started

### Installation

    $ npm install session-file-store

### Running Tests

    $ npm install
    $ npm test

## Options

  - `path`               The directory where the session files will be stored. Defaults to `./sessions`
  - `ttl`                Session time to live in seconds. Defaults to `3600`
  - `retries`            The number of retries to get session data from a session file. Defaults to `5`
  - `factor`             The exponential factor to use for retry. Defaults to `1`
  - `minTimeout`         The number of milliseconds before starting the first retry. Defaults to `50`
  - `maxTimeout`         The maximum number of milliseconds between two retries. Defaults to `100`
  - `reapIntervalObject` [OUT] Contains intervalObject if reap was scheduled
  - `reapInterval`       Interval to clear expired sessions in seconds or -1 if do not need. Defaults to `1 hour`
  - `reapAsync`          use distinct worker process for removing stale sessions. Defaults to `false`
  - `reapSyncFallback`   reap stale sessions synchronously if can not do it asynchronously. Default to `false`
  - `logFn`              log messages. Defaults to `console.log`
  - `fallbackSessionFn`  returns fallback session object after all failed retries. No defaults
  - `secret`             if secret string is specified then enables encryption of the session before writing the file and also decryption when reading it.
  - `encryptEncoding`    Encryption output encoding. Defaults to `'hex'`
  - `encoding`           Object-to-text text encoding. Can be null. Defaults to `'utf8'`
  - `encoder`            Encoding function. Takes object, returns encoded data. Defaults to `JSON.stringify`
  - `decoder`            Decoding function. Takes encoded data, returns object. Defaults to `JSON.parse`
  - `fileExtension`      File extension of saved files. Defaults to `'.json'`
  - `keyFunction`        Encryption key retrieval function. Takes secret and session id, returns key. Defaults to `function(secret, sessionId){return secret + sessionId;}`

## Usage

### Express or Connect integration

Due to express `>= 4` changes, we need to pass `express-session` to the function `session-file-store` exports in order to extend `session.Store`:

```js
var session = require('express-session');
var FileStore = require('session-file-store')(session);

app.use(session({
    store: new FileStore(options),
    secret: 'keyboard cat'
}));
```

## Examples

You can found basic work [app examples](https://github.com/valery-barysok/session-file-store/tree/master/examples)
for [express](https://github.com/valery-barysok/session-file-store/tree/master/examples/express-example),
[connect](https://github.com/valery-barysok/session-file-store/tree/master/examples/connect-example) and
[koa](https://github.com/valery-barysok/session-file-store/tree/master/examples/koa-example) frameworks in `examples` folder.

[npm-version-image]: https://img.shields.io/npm/v/session-file-store.svg?style=flat-square
[npm-downloads-image]: https://img.shields.io/npm/dm/session-file-store.svg?style=flat-square
[npm-url]: https://npmjs.org/package/session-file-store
[travis-image]: https://img.shields.io/travis/valery-barysok/session-file-store/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/valery-barysok/session-file-store
[coveralls-image]: https://img.shields.io/coveralls/valery-barysok/session-file-store/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/valery-barysok/session-file-store?branch=master
[node-image]: https://img.shields.io/node/v/session-file-store.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[express-session-url]: https://github.com/expressjs/session
