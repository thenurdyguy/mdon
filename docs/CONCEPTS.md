## Concepts

### Fragments

Fragments are sections or regions that will be processed in the order by which
they appear in markdown.

  1. Fragments begin with a variant of an opening `<?[ directive ]?>` tag
  immediately at the start of a new line (no spaces).

  2. This is followed by an optional body which ends with the closing `<?!>`
  tag also on a new line without spaces.

  3. If it is not in a well-formed fragment it will come back to haunt you.

### Directives

Directives are either a marker or a template literal expression enclosed between
the `<?` and `?>` of an opening tag.

1. Static tags starting with `<? ?>` make MDon hands-off till `<?!>`.

2. Generated tags starting with `<?!?>` make everything till `<?!>` sleep
with the fishes (those are MDons business not yours).

3. Template tags starting with ``<? `MDon will obey your ${[interpolations]}` ?>``
make up everything that will take over till `<?!>`.

### Interpolations

Template expressions follow standard javascript interpolations for the most part
but they are evaluated in a sandboxed environment to prevent malicious or
unintended mishaps.

  1. `${displayName}`: Any field in your package.json (only single property
  names or property paths are supported, not statements).

  2. `${@<operation>( … args )}`: MDon will, at least:

      a. Either `${@exists(path/to/file)}` finds the file relative to the root
      of the package or it throws and you get nothing out.

      b. You can borrow `${@include(…/file)}` from other files in your package.

      c. With `${@alias(<relative-or-absolute-url>)}` you get `[title][alias]`
      instead of `[title](<relative-or-absolute-url>)`, this means that you also
      will get see a line that looks like `[alias]: <relative-or-absolute-url>`
      at the end of the file, it's just how aliases work in markdown.

  3. `` `${ {{displayName}} + ' ' + {{version}} }` `` is MDon's way of taking
  care of business if you decide that programming should be be something the
  MDon takes care of anyway, but honestly is `` `${displayName} ${version}` ``
  not good enought already… MDon always asks himself that question.

## Latest Perks

> **Experimental Relative Paths:**
>
> Starting from v1.0.0-alpha.6 you may use relative paths to any operation which
will be resolved relative to the path of the markdown file they appear in. So in
stead of using absolute paths, you can now ``<?`${@include('./OTHER.md')}`?>``
to include it from the folder of the document your are authoring, similar to how
relative ES modules and CSS imports work. Of course, unlike ES modules if your
path does not begin with a './' it will actually be resolved relative to the
root of your project not your `node_modules`!

> **Using Raw "Source" Paths:**
>
> A common and highly recommended structure when working with compiled files is
to separate source files from compiled files, which is not a requirement for
MDon since it can recompile from compiled files but may still be a more robust
setup in case something goes wrong. To opt in to this behaviour the first line
of the target file needs to be begin with `<!--%path/to/source.md%-->`.
>
> So if you want your `./README.md` to compile from `./docs/README.md` then you
can simply create a blank `./README.md` and set the first line to `<!--%docs/README.md%-->`.

> **Safe Output by Default:**
>
> At the moment some package managers are working on fixes for misinterpretting
syntax that should normally not be visible when rendering markdown content on
their websites, so by default MDon will wrap fragments with `<!--…-->` in all
files. In the future this will only be the default behaviour for files declaring
a raw source like `<!--%docs/README.md%-->`.

## Gotchas

  1. If you don't match your `<?…?>` with a `<?!>` you'll be sorry, things tend
  to go missing so if you want static content that does not go swimming wrap
  those lines with the `<? ?>` on the line before and `<?!>` on the line after.

  2. No plugins, so hack all you want, it's one file, copy it into your project
  and hack away, that's better than flooding your code with plugins.

  3. MDon likes to put things in multiples of 3, you know, a-b-c, 1-2-3.

