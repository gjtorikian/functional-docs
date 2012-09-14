var funcDoc = require('../index.js');

funcDoc.runTests([ './files'], {stopOnFail: false, ext: ".html", mapPrefix: true}, function(err, results) {
	//console.log("Nothing.");
    console.log(results)
});