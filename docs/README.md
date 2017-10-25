---
 suffix: ""
---
<? `![${displayName} logo][${@alias('https://cdn.rawgit.com/polyestr/mdon/master/assets/logo.svg', 'asset')}]` ?>
<?!>

<? `# ${displayName} ${suffix}` ?>
<?!>

<? `${description}` ?>
<?!>

<? `${@include('./FEATURES.md')}` ?>
<?!>

<? ?>
**Note:** MDon is still highly experimental and is not yet cross-platform
enabled, so if you managed to use it on Windows or Linux or worked-out quirks,
please submit an issue, not a PR at this point, but feel free to gist.

*Stay up-to-date by checking the [changelog](CHANGELOG.md).*
<?!>

<? `## Installation\n\n    » yarn add ${name}` ?>
<?!>

<? `${@include('./USAGE.md')}` ?>
<?!>

<? `\n\n---\n\n${@include('./CONCEPTS.md')}` ?>
<?!>

<? `\n\n---\n${@include('./FAQ.md')}` ?>
<?!>
