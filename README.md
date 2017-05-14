# web-build-tools

[![Build Status](https://travis-ci.org/Microsoft/web-build-tools.svg?branch=master)](https://travis-ci.org/Microsoft/web-build-tools)

_**This repo hosts a collection of tools and libraries used to build web projects at Microsoft.**_

- **[CURRENT NEWS](https://github.com/Microsoft/web-build-tools/wiki)**:  See what's happening!

Highlighted projects:

- **[API Extractor](https://github.com/Microsoft/web-build-tools/wiki/API-Extractor)** helps you build better TypeScript libraries.  It standardizes your exported API surface, generates your online API reference, and makes it easy to detect and review PRs that impact your API contract.

- **[Gulp Core Build](https://github.com/Microsoft/web-build-tools/wiki/Gulp-Core-Build)**: If you maintain hundreds of projects, **gulp-core-build** gets you out of the business of maintaining hundreds of Gulpfiles.  It provides a standard way to define reusable "rigs" that are customized using simple config files. 

- **[Rush](https://github.com/Microsoft/web-build-tools/wiki/Rush)**: Want to consolidate all your web projects in one big repo?  Rush is a fast and reliable solution for installing, linking, building, publishing, checking, change log authoring, and anything else that involves a "package.json" file.

# Full Project Inventory


## Apps

### [@microsoft/rush](./apps/rush/README.md)

The professional solution for consolidating all your JavaScript projects in one Git repo.

[![npm version](https://badge.fury.io/js/%40microsoft%2Frush.svg)](https://badge.fury.io/js/%40microsoft%2Frush)
[![Dependencies](https://david-dm.org/Microsoft/rush.svg)](https://david-dm.org/Microsoft/rush)

### [@microsoft/rush-lib](./apps/rush-lib/README.md)

A library for scripts that interact with the Rush tool.

[![npm version](https://badge.fury.io/js/%40microsoft%2Frush-lib.svg)](https://badge.fury.io/js/%40microsoft%2Frush-lib)
[![Dependencies](https://david-dm.org/Microsoft/rush-lib.svg)](https://david-dm.org/Microsoft/rush-lib)


## Core Build: Tasks

### [@microsoft/gulp-core-build](./core-build/gulp-core-build/README.md)

Defines the build task model, config file parser, and rig framework for the **Gulp Core Build** system, along with some essential build tasks. 

[![npm version](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build.svg)](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build)
[![Dependencies](https://david-dm.org/Microsoft/gulp-core-build.svg)](https://david-dm.org/Microsoft/gulp-core-build)

### [@microsoft/gulp-core-build-karma](./core-build/gulp-core-build-karma/README.md)

A build task for running unit tests using `karma` + `phantomjs` + `mocha` + `chai`. This setup allows you to run browser-based testing.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-karma.svg)](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-karma)
[![Dependencies](https://david-dm.org/Microsoft/gulp-core-build-karma.svg)](https://david-dm.org/Microsoft/gulp-core-build-karma)

### [@microsoft/gulp-core-build-mocha](./core-build/gulp-core-build-mocha/README.md)

A build task for running unit tests using `mocha` + `chai`. This setup is useful for unit testing build tools, as it runs in the NodeJS process rather than in a browser.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-mocha.svg)](https://badge.fury.io/js/gulp-core-build-mocha)
[![Dependencies](https://david-dm.org/Microsoft/gulp-core-build-mocha.svg)](https://david-dm.org/Microsoft/gulp-core-build-mocha)

### [@microsoft/gulp-core-build-sass](./core-build/gulp-core-build-sass/README.md)

A build task which processes scss files using SASS, runs them through `postcss`, and produces CommonJS/AMD modules which are injected using the `@microsoft/load-themed-styles` package.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-sass.svg)](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-sass)
[![Dependencies](https://david-dm.org/Microsoft/gulp-core-build-sass.svg)](https://david-dm.org/Microsoft/gulp-core-build-sass)

### [@microsoft/gulp-core-build-serve](./core-build/gulp-core-build-serve/README.md)

A build task for testing/serving web content on the localhost, and live reloading it when things change.  This drives the `gulp serve' experience.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-serve.svg)](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-serve)
[![Dependencies](https://david-dm.org/Microsoft/gulp-core-build-serve.svg)](https://david-dm.org/Microsoft/gulp-core-build-serve)

### [@microsoft/gulp-core-build-typescript](./core-build/gulp-core-build-typescript/README.md)

Build tasks for invoking the TypeScript compiler, `tslint`, and [api-extractor](https://github.com/Microsoft/web-build-tools/wiki/API-Extractor).

[![npm version](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-typescript.svg)](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-typescript)
[![Dependencies](https://david-dm.org/Microsoft/gulp-core-build-typescript.svg)](https://david-dm.org/Microsoft/gulp-core-build-typescript)

### [@microsoft/gulp-core-build-webpack](./core-build/gulp-core-build-webpack/README.md)

A build task which introduces the ability to bundle various source files into a set of bundles using `webpack`.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-webpack.svg)](https://badge.fury.io/js/%40microsoft%2Fgulp-core-build-webpack)
[![Dependencies](https://david-dm.org/Microsoft/gulp-core-build-webpack.svg)](https://david-dm.org/Microsoft/gulp-core-build-webpack)

## Core Build: Rigs

### [@microsoft/node-library-build](./core-build/node-library-build/README.md)

A **Gulp Core Build** rig which provides basic functionality for building and unit testing TypeScript projects intended to run under NodeJS.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fnode-library-build.svg)](https://badge.fury.io/js/%40microsoft%2Fnode-library-build)
[![Dependencies](https://david-dm.org/Microsoft/node-library-build.svg)](https://david-dm.org/Microsoft/node-library-build)

### [@microsoft/web-library-build](./core-build/web-library-build/README.md)

A **Gulp Core Build** rig for building web libraries. It includes build tasks for processing css, typescript, serving, and running browser tests using karma.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fweb-library-build.svg)](https://badge.fury.io/js/%40microsoft%2Fweb-library-build)
[![Dependencies](https://david-dm.org/Microsoft/web-library-build.svg)](https://david-dm.org/Microsoft/web-library-build)


## Libraries

### [@microsoft/api-extractor](./libraries/api-extractor/README.md)

Validate, document, and review the exported API for a TypeScript library.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fapi-extractor.svg)](https://badge.fury.io/js/%40microsoft%2Fapi-extractor)
[![Dependencies](https://david-dm.org/Microsoft/api-extractor.svg)](https://david-dm.org/Microsoft/api-extractor)

### [@microsoft/node-core-library](./libraries/node-core-library/README.md)

Essential libraries that every NodeJS toolchain project should use.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fnode-core-library.svg)](https://badge.fury.io/js/%40microsoft%2Fnode-core-library)
[![Dependencies](https://david-dm.org/Microsoft/node-core-library.svg)](https://david-dm.org/Microsoft/node-core-library)

### [@microsoft/package-deps-hash](./libraries/package-deps-hash/README.md)

`package-deps-hash` is mainly used by Rush.  It generates a JSON file containing the Git hashes of all input files used to build a given package.

[![npm version](https://badge.fury.io/js/%40microsoft%2Fpackage-deps-hash.svg)](https://badge.fury.io/js/%40microsoft%2Fpackage-deps-hash)
[![Dependencies](https://david-dm.org/Microsoft/package-deps-hash.svg)](https://david-dm.org/Microsoft/package-deps-hash)
