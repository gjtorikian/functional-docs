var fs = require('fs'),
    util = require('util'),
    path = require('path');

var preTest = require('./pre'),
    postTest = require('./post');

var async = require('async'),
    findit = require('findit'),
    jsdom = require('jsdom'),
    wrench = require('wrench'),
    colors = require('colors');

var srcFiles, outFiles, ext;

var readFiles = {};

exports.runTests = function(srcDir, options, callback) {
  var stopOnFail = options.stopOnFail || false;
  ext = options.ext || ".html";

  console.log("Running tests on " + srcDir);

  loadFiles(srcDir, function(err, srcFiles) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    async.forEach(srcFiles, function(fileName, forEachCB) { 
      var file = srcDir + "/" + fileName;
      if (file.match(new RegExp(ext + "$"))) {
        fs.readFile(file, 'utf8', function(err, content) { 
          if (err) {
            if (!fs.lstatSync(file).isDirectory()) {
              console.error("Error starting to read file " + file);
              console.error(err);
              process.exit(1);
            }
          }
          var doc = jsdom.jsdom(content);

          readFiles[file] = doc;

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
                postTest.checkBrokenLocalLink(file, doc, readFiles, function(errors) {
                  checkForErrors(errors, stopOnFail, cb);
                });
              }
          ], function(err, results) {
              forEachCB(null);
          });
        });
      }
    }, function (err, results) {
        console.log("Finished running tests on " + srcDir);
        callback(err);
    })
  })
};

function checkForErrors(errors, breakOnFail, callback) {
  for (var e in errors) {
    console.error(errors[e].magenta);
  }
  if (breakOnFail) {
    console.error("Halting due to failures".magenta);
    process.exit(1);
  }
  callback(null);
}

function loadFiles(dirs, callback) {
  async.forEach(dirs, function(dir, cb) {
    var listOfFiles = wrench.readdirSyncRecursive(dir);
    callback(null, listOfFiles);
  });
}