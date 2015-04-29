# session-file-store

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

[![NPM](https://nodei.co/npm/session-file-store.png?downloads=true)][npm-url]

Session file store is a provision for storing session data in the session file

> Note: session-file-store supports express `>= 4.0.0` and connect `>=1.4.0`

## Community

[![Join the chat at https://gitter.im/valery-barysok/session-file-store][gitter-join-chat-image]][gitter-channel-url]

## Installation

    $ npm install session-file-store

## Options

  - `path`         The directory where the session files will be stored. Defaults to `./sessions`
  - `ttl`          Time to live in seconds. Defaults to 3600
  - `retries`      The number of retries to get session data from a session file. Defaults to 5
  - `factor`       Defaults to 1
  - `minTimeout`   Defaults to 50
  - `maxTimeout`   Defaults to 100
  - `reapInterval` Interval to clear expired sessions in seconds or -1 if do not need. Defaults to 1 hour
  - `reapAsync`    use distinct worker process for removing stale sessions. Defaults to true

## Usage

Due to express `>= 4` changes, we need to pass `express-session` to the function `session-file-store` exports in order to extend `session.Store`:

    var session = require('express-session');
    var FileStore = require('session-file-store')(session);

    app.use(session({
        store: new FileStore(options),
        secret: 'keyboard cat'
    }));

## Examples

You can found basic work app examples for express and connect frameworks in example folder.

[npm-version-image]: https://img.shields.io/npm/v/session-file-store.svg
[npm-downloads-image]: https://img.shields.io/npm/dm/session-file-store.svg
[npm-url]: https://npmjs.org/package/session-file-store
[travis-image]: https://img.shields.io/travis/valery-barysok/session-file-store/master.svg
[travis-url]: https://travis-ci.org/valery-barysok/session-file-store
[coveralls-image]: https://img.shields.io/coveralls/valery-barysok/session-file-store/master.svg
[coveralls-url]: https://coveralls.io/r/valery-barysok/session-file-store?branch=master
[node-image]: https://img.shields.io/node/v/session-file-store.svg
[node-url]: http://nodejs.org/download/
[gitter-join-chat-image]: https://badges.gitter.im/Join%20Chat.svg
[gitter-channel-url]: https://gitter.im/valery-barysok/session-file-store