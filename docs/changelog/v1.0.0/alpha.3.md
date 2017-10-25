<? `### ${document.name} [public] — October 19, 2017` ?>
<?!>
* Refactor to use classes (preparing for modularization)
* Implement HTML Comment wrapping with rounttrip parsing
* Add safe-wrapping `<!--?…?-->` to work with yarn's rendering
* Implement rawpath strategy which always uses safe-wrapping to render fragment-free output (when viewed on github/npm/yarn)
* Add YAML compatibility & Improve file resolution and console output
* Fix issue where YAML frontmatter was included in safe output mode
* Update docs using latest MDon markup
