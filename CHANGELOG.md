# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]


## [v0.9.4] - 2020-05-01

### Added

- CHANGELOG.md

### Changed

- Ran `npm audit fix`
- The demo now supports all modern browsers, not just Google Chrome with experimental support for
  import maps.
- Run automated tests against `janus-gateway` v0.9.2

### Removed

- Don't require a specific Node.js version. This was only for tests and not for the package itself. Remove `engines` field from `package.json`.


## [v0.9.3] - 2020-03-23

### Added

- Require Node 13.11.0

### Changed

- Ran `npm audit fix`
- Show testing badge from master branch (README)


## [v0.9.2] - 2020-01-25

### Added

- Test for Janus admin API to document the exact version of Janus we were developing for.


## [v0.9.1] - 2020-01-25

### Changed

- README


## [v0.9.0] - 2020-01-21

- remove uptime feature
- enable reception of plugin messages after plugin detachment
- turn off default logging for Session (empty function instead of console)
- rename log to logger
- improve code style and documentation
- refactor demo for better readability
