<!--%docs/CHANGELOG.md%-->
<!--	*** THIS FILE IS DYNAMICALLY GENERATED ***	-->
<!--? `# ${displayName} Changelog` ?-->
# MDon Changelog
<!--?!-->
<!--? `${@include('./changelog/v1.0.0.md')}` ?-->
## v1.0.0
<!--? `${@include('./v1.0.0/alpha.6.md')}` ?-->
<!--? `### ${document.name} [public] — October 23, 2017` ?-->
### alpha.6 [public] — October 23, 2017
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
<!--?!-->
<!--? `${@include('./v1.0.0/alpha.5.md')}` ?-->
<!--? `### ${document.name} [public] — October 20, 2017` ?-->
### alpha.5 [public] — October 20, 2017
<!--?!-->
* Add manually created lib/index.d.ts types
* Update docs using latest MDon markup
* Add keywords/topics to package and repository
<!--?!-->
<!--? `${@include('./v1.0.0/alpha.4.md')}` ?-->
<!--? `### ${document.name} [public] — October 19, 2017` ?-->
### alpha.4 [public] — October 19, 2017
<!--?!-->
* Remove unused files
* Update docs using latest MDon markup
<!--?!-->
<!--? `${@include('./v1.0.0/alpha.3.md')}` ?-->
<!--? `### ${document.name} [public] — October 19, 2017` ?-->
### alpha.3 [public] — October 19, 2017
<!--?!-->
* Refactor to use classes (preparing for modularization)
* Implement HTML Comment wrapping with rounttrip parsing
* Add safe-wrapping <!--?…?--> to work with yarn's rendering
* Implement rawpath strategy which always uses safe-wrapping to render fragment-free output (when viewed on github/npm/yarn)
* Add YAML compatibility & Improve file resolution and console output
* Fix issue where YAML frontmatter was included in safe output mode
* Update docs using latest MDon markup
<!--?!-->
<!--? `${@include('./v1.0.0/alpha.2.md')}` ?-->
<!--? `### ${document.name} [not public] — October 16, 2017` ?-->
### alpha.2 [not public] — October 16, 2017
<!--?!-->
* Refactor mdon helpers
* Update docs using latest MDon markup
<!--?!-->
<!--? `${@include('./v1.0.0/alpha.1.md')}` ?-->
<!--? `### ${document.name} [not public] — October 19, 2017` ?-->
### alpha.1 [not public] — October 19, 2017
<!--?!-->
* Implement mdon as vanilla js & mjs node modules
* Add docs using first mdon notation
* Add test/package with simple very simple (manually verified) api test
* Update docs using latest MDon markup
<!--?!-->
<!--?!-->

<!--?!?-->

---
Last Updated: Monday, October 23, 2017, 9:52:10 PM UTC
<!--?!-->
