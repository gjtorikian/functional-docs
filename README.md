# Introduction

Generate HTML files? Use them for documentation? Great, then this tool might be for you.

Here are a set of tests to validate your HTML output. These tests check if your image references are legitimate, if they have alt tags, if your internal links are working, and so on. It's intended to be an all-in-one checker for your documentation output.

This does **not** check for grammar or spelling mistakes, nor stylistic issues (_e.g._, typing _e.g._ instead of e.g.)...but it might one day.

# Usage

Simple: install from npm:

	npm install functional-docs

Then call a single function, `runTests()`:

```javascript
var funcDoc = require('functional-docs');

funcDoc.runTests([ './files'], {stopOnFail: false, ext: ".html"}, function(err) {
	
});
```

`runTests()` takes three parameters:

* An array of directories, with files you want to test
* An object specifying various ways to run the tests. Though some of the properties are optional, the parameter itself is not:
	* `stopOnFail` indicates if you want the testing to stop once a failure is found; defaults to `false`
	* `ext` indicates the extension of the files you want to test; defaults to ".html"
	* `mapPrefix`: if images start with a `/`, the test assumes it's at `./`. This is mostly for routing compatability with express.
* A callback function to execute upon completion

# What's Tested?

* Whether all your images have alt tags
* Whether your internal image references are not broken
* Whether your internal links are not broken; this includes hash references (`#linkToMe`)
* Case-sensitivity for your files and images

## Pre- and Post Tests?

If you think about it, some tests can actually be run _before_ you compile into HTML. For example, if I was writing documentation in Markdown ([which I do](https://github.com/gjtorikian/panda-docs)), I could just check to see if `![]` was erronously references. I've grouped this distinction in folders marked _pre_ and _post_.

Then I started thinking that users might write their docs in reStructuredText, AsciiDoc, Pandoc, or some other format, so I decided to just focus right now on the rendered HTML output, and concentrate on catching formats as time allowed.