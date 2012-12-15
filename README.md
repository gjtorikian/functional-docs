# Introduction

Generate HTML files? Use them for documentation? Great, then this tool might be for you.

Here are a set of tests to validate your HTML output. These tests check if your image references are legitimate, if they have alt tags, if your internal links are working, and so on. It's intended to be an all-in-one checker for your documentation output.

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
	* `remap`: an object that contains two properties, `links` and `images, which define rerouting rules. This is mostly for routing compatability with express. For example:  
	```
	remap: {
            links: {
                "/path": __dirname + "/out/path", 
                "/path1/path2": __dirname + "/out/path1/path2", 
            }, 
            images: {}
      }
    ```
    In this context, your source files would have an href to "/path" and "/path1/path2". Express will add routes to these paths (because you defined them). Meanwhile, the tester will actually _look_ for the files in _dirname + "/out/path"_. The tester will not change the content of your HTML files; it'll only resolve links it finds as "/path" as if they referred to _dirname + "/out/path"_.
    * `safeWords` is an array of strings you want the spellchecker to ignore
    * `skipSpelling` skips the spelling check entirely
* A callback function to execute upon completion

# What's Tested?

* Whether all your images have alt tags
* Whether your internal image references are not broken
* Whether your internal links are not broken; this includes hash references (`#linkToMe`)
* Case-sensitivity for your files and images
* Spelling and grammer issues

## Pre- and Post Tests?

If you think about it, some tests can actually be run _before_ you compile into HTML. For example, if I was writing documentation in Markdown ([which I do](https://github.com/gjtorikian/panda-docs)), I could just check to see if `![]` was erronously references. I've grouped this distinction in folders marked _pre_ and _post_.

Then I started thinking that users might write their docs in reStructuredText, AsciiDoc, Pandoc, or some other format, so I decided to just focus right now on the rendered HTML output, and concentrate on catching markup languages if the time ever allows.