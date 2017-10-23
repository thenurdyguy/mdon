<!--? `### ${document.name} [public] — October 23, 2017` ?-->
<!--?!-->

**Breaking Changes:** This release introduces drastic changes.

*Markup*
* Add support for './' paths which are resolved relative to file.
* Add a "DYNAMICALLY GENERATED" comment to files generated from a raw source.

*Source Code*

* Reimplement using TypeScript

  This reimplementation takes all the code out of the lib/index.m?js and breaks it down to single-entity files inside src/*.ts. Using a new experimental tsconfig layout (root tsconfig extends src/tsconfig) and ts module (none) a new lib/mdon.js is compiled which follows the same structure as the previous vanilla code. The only difference is that mdon.js uses require by default and both index.mjs and .js are simply wrappers for it for CLI & API functionality.

*CLI*

* Improves argv handling assuming argv[1] is always main

   Instead of argv.findIndex we now simple assume argv[1] is our main file and test it against the mdon main file arg matcher. See https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_process_argv

*Package*

* Rename package to 'MDon' without 'Polyestr'
* Add mdon & mdon~ scripts to root (also used by package scripts now)

*Test Package*

* Updated test scripts in package & test/package
* Add very basic api test in test/package

  Checks that main function is exported and `new mdon.Package().info.name`
  and `require('./package.json').name` as identical;

*Documentation*

* Add CHANGELOG using $include with relative paths
* Updated README using $include with relative paths
* Update docs using latest MDon markup



