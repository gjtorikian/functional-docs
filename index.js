var fs = require('fs'),
    util = require('util'),
    path = require('path');

var preTest = require('./pre/pre_tests'),
    postTest = require('./post/post_tests');

var async = require('async'),
    findit = require('findit'),
    jsdom = require('jsdom'),
    wrench = require('wrench'),
    colors = require('colors');

var srcDir, srcFiles, outFiles, ext, stopOnFail, options;

var readFiles = {};

exports.runTests = function(src, opts, callback) {
  options = opts;
  stopOnFail = options.stopOnFail || false;
  ext = options.ext || ".html";
  srcDir = src;

  console.log("Running tests on " + srcDir);

  loadFiles(srcDir, function(err, srcFiles) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    async.forEach(srcFiles, runIndividualTest, function (err) {
        console.log("Finished running tests on " + srcDir);
        return callback(err);
    });
  });
};

function runIndividualTest(fileName, callback) {
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

      jsdom.env(content, function(err, window) {
        doc = window.document;
        readFiles[file] = doc;

        async.parallel([
            function(cb) {
              preTest.checkMissingAltTag(file, doc, options, function(errors) {
                checkForErrors(errors, stopOnFail, cb);
              });
            },
            function(cb) {
              preTest.checkBrokenExternalLink(file, doc, options, function(errors) {
                checkForErrors(errors, stopOnFail, cb);
              });
            },
            function(cb) {
              postTest.checkMissingImage(file, doc, options, function(errors) {
                checkForErrors(errors, stopOnFail, cb);
              });
            },
            function(cb) {
              postTest.checkBrokenLocalLink(file, doc, readFiles, options, function(errors) {
                checkForErrors(errors, stopOnFail, cb);
              });
            }
          ], function(err, results) {
              callback(err);
        });
      });
    });
  }
  else {
    callback(null);
  }
}

function checkForErrors(errors, stopOnFail, cb) {
  while (errors.length) {
    console.error(errors[errors.length - 1].red);
    errors.pop();
    if (stopOnFail) {
      console.error("Halting due to failures".magenta);
      process.exit(1);
    }
  }

  cb(null);
}

function loadFiles(dirs, callback) {
  async.forEach(dirs, function(dir, cb) {
    var listOfFiles = wrench.readdirSyncRecursive(dir);
    callback(null, listOfFiles);
  });
}