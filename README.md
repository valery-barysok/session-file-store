session-file-store
==================

Session file store is a provision for storing session data in the session file

## Installation

      $ npm install session-file-store

## Options

  - `path`       The directory where the session files will be stored. Defaults to `./sessions`
  - `ttl`        Time to live in seconds
  - `retries`    The number of retries to get session data from a session file. Defaults to 5
  - `factor`     Defaults to 1
  - `minTimeout` Defaults to 50
  - `maxTimeout` Defaults to 50
