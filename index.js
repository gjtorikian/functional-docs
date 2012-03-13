var fs = require('fs'),
    util = require('util'),
    path = require('path');

var preTest = require('./pre'),
    postTest = require('./post');

var async = require('async'),
    findit = require('findit'),
    jsdom = require('jsdom');

var srcFiles, outFiles, ext;

exports.runTests = function(srcDir, options, callback) {
  var stopOnFail = options.stopOnFail || false;
  ext = options.ext || ".html";

  loadFiles(srcDir, function(err, srcFiles) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    async.forEach(srcFiles, function(file, forEachCB) {
      fs.readFile(file, 'utf8', function(err, content) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        var doc = jsdom.jsdom(content);

        async.parallel([
            function(cb) {
              preTest.checkMissingAltTag(file, doc, function(errors) {
                checkForErrors(errors, stopOnFail, cb);
              });
            },
            function(cb) {
              preTest.checkBrokenExternalLink(file, doc, function(errors) {
                checkForErrors(errors, stopOnFail, cb);
              });
            },
            function(cb) {
              postTest.checkMissingImage(file, doc, function(errors) {
                checkForErrors(errors, stopOnFail, cb);
              });
            },
            function(cb) {
              postTest.checkBrokenLocalLink(file, doc, function(errors) {
                checkForErrors(errors, stopOnFail, cb);
              });
            }
        ], function(err, results) {
            forEachCB(null);
        });
      });
    }, function (err, results) {
        console.log("Finished running tests!");
        callback(err);
    })
  })
};

function checkForErrors(errors, breakOnFail, callback) {
  for (var e in errors) {
    console.error(errors[e]);
  }
  if (breakOnFail) {
    console.error("Halting due to failures");
    process.exit(1);
  }
  callback(null);
}

function loadFiles(dir, callback) {
    async.map(dir, checkDir, function(err, results) {
      // unfortunate necessity; .on('directory') below returns an array, there's no way
      // that I can tell to actually replace an element with many more elements
      var subArray = [];
      for (var i = 0; i < results.length; i++) {
          if (Array.isArray(results[i])) {
            var dirArray = results[i];
            dirArray.forEach(function (f) {
              subArray.push(f);
            });
            results.splice(i, 1);
            i--;
          }
      }
        results = results.concat(subArray);
        
        callback(err, eliminateDuplicates(results));
    }); 
}

function checkDir(item, callback) {
  var results = [], item = path.resolve(process.cwd(), item);

      fs.stat(item, function(err, stats) {
        if (stats === undefined) {
          console.error("stats is undefined for " + item);
        }
        if (stats.isDirectory()) {
          var finder = findit.find(item);

          finder.on('file', function (file, stat) {
            if (path.extname(file) == ext) {
              results.push(file);
            }
          });

          finder.on('directory', function (dir, stat) {
            //console.log("Digging into " + dir);
          }); 

          finder.on('end', function () {
            callback(err, results);
         });
        }
        else if (path.extname(item) == ext) {
          callback(err, item);
        }
    });
}

function eliminateDuplicates(arr) {
  var i,
      len=arr.length,
      out=[],
      obj={};

  for (i=0;i<len;i++) {
    obj[arr[i]]=0;
  }
  for (i in obj) {
    if (i !== undefined && i !== '') {
        out.push(i);
    }
  }
  return out;
}