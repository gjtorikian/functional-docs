var fs = require('fs');
var path = require('path');

var jsdom = require('jsdom'),
    wrench = require('wrench');

var helpers = require('../helpers');

exports.checkMissingImage = function(filename, doc, options, callback) {
    var errors = [];
    var imgList = doc.getElementsByTagName("img");

    if (imgList !== undefined) {
        for (var i = 0; i < imgList.length; i++) {
            var src = imgList[i].getAttribute("src");

            if (src === undefined || src.length === 0) {
                errors.push(printMessage("Missing src attribute", filename));//, l, lines[l]));
            }
            else {
                if (options.mapPrefix && src.charAt(0) == "/") {
                    src = "." + src;
                }
                    
                var lastSlashPos = src.lastIndexOf("/");
                var refDirName = src.substr(0, lastSlashPos);
                var refFileName = src.substr(lastSlashPos + 1);

                var filepath = path.resolve(path.dirname(filename) + "/"  + src);

                if (refDirName.length === 0 || lastSlashPos < 0) {
                    refDirName = path.dirname(filepath);
                }
                refDirName = path.resolve(path.dirname(filename), refDirName);

                if (!path.existsSync(refDirName + "/" + refFileName)) {
                    errors.push(printMessage("Image " + src + " does not exist", filename));
                }
                else {
                    var files = wrench.readdirSyncRecursive(refDirName);
                    var fileExists = helpers.casedFileCheck(refDirName, files, filepath);
                    
                    if (!fileExists) {
                        errors.push(printMessage("Image " + src + " does not exist (due to case sensitivity)", filename));//, l, lines[l]));
                    }
                }
            }
        }
    }

    callback(errors);
};

exports.checkBrokenLocalLink = function(filename, doc, readFiles, options, callback) {
    var errors = [];
    var aList = doc.getElementsByTagName("a");

    if (aList !== undefined) {
        for (var i = 0; i < aList.length; i++) {
            var href = aList[i].getAttribute("href");

            if (href !== undefined && href.length > 0) {
                // not an external link, or ignorable link (/,, #)
                if (!href.match(/www/) && !href.match(/https?:/) && !href.match(/^mailto:/) && href !== '/' && href != '#' && href != 'javascript:void(0)')  {
                    var filepath = path.resolve(path.dirname(filename) + "/"  + href);
                
                    if (href.match(/\#/)) { // a reference to somewhere internal
                        var hashFile = href.substr(0, href.indexOf("#"));
                        var hashId = href.substr(href.indexOf("#") + 1); 

                        if (hashFile.length > 0)
                        {
                            filepath = path.resolve(path.dirname(filename) + "/"  + hashFile);

                            // check if file exists first
                            if (fileCheck(hashFile, filename, filepath, false, errors)) {
                                //console.log(hashFile + " is legit.");
                                // then, validate the hash ref

                                // prevent too many files from being read--just see if the content exists already
                                var hashDoc = readFiles[filepath];

                                if (hashDoc == undefined) {
                                    var content = fs.readFileSync(filepath, 'utf8');
                                    hashDoc = jsdom.jsdom(content);
                                    readFiles[filepath] = hashDoc;
                                }

                                // do the actual check (finally!)
                                if (hashDoc.getElementById(hashId) === null) {
                                    errors.push(printMessage(hashFile + " has an incorrect external hash to '#" + hashId +"'", filename));
                                }
                                else {
                                    //console.log("Yes, " + hashFile + "#" + hashId + " is okay.");
                                }
                            } 
                        } 
                        else { // if the hash file doesn't exist, this is an internal hash (i.e. "href='#blah'")
                            if (doc.getElementById(hashId) === null) {
                                // checking the name attribute; I weep to do this twice
                                var foundName = false;
                                var links = doc.getElementsByTagName('a');
                          
                                for (var l = 0; l< links.length; l++){
                                  var n = links[l].getAttribute("name");
                                  if (n && n == hashId) {
                                      foundName = true;
                                      break;
                                  }
                                }
                                if (!foundName)
                                    errors.push(printMessage(filename + " has an incorrect internal hash to '#" + hashId + "'", filename));
                            }
                            else {
                                //console.log("Yes, " + filename + "#" + hashId + " is okay.");
                            }
                        }
                    }
                    else {
                        fileCheck(href, filename, filepath, true, errors);
                    }
                }
            }
        }
    }

  callback(errors);
};

function fileCheck(href, file, filepath, noHash, errors)
{
    var found = false;
    var lastSlashPos = href.lastIndexOf("/");
    var refDirName = href.substr(0, lastSlashPos);
    var refFileName = href.substr(lastSlashPos + 1);

    if (refDirName.length === 0 || lastSlashPos < 0) {
        refDirName = path.dirname(filepath);
    }
    
    refDirName = path.resolve(path.dirname(file), refDirName);

    if (!path.existsSync(refDirName)) {
        errors.push(printMessage(file + " is trying to link to " + refDirName + ", which isn't a directory", file));
        return false;
    }

    if (!path.existsSync(refDirName + "/" + refFileName)) {
        errors.push(printMessage(file + " is trying to incorrectly link to " + href + " as " + filepath, file));
        return false;
    }
    
    if (noHash) {
        return true;
        var files = wrench.readdirSyncRecursive(refDirName);
        var fileExists = helpers.casedFileCheck(refDirName, files, filepath);

        if (!fileExists) {
            errors.push(printMessage(file + " is trying to incorrectly link to " + href + " (due to case sensitivity) as " + filepath, file));
            return false;
        }
    }

    return true;
}

function printMessage(msg, filename, line, string) {
  return msg + " in " + path.basename(filename);// + " around line " + line + ": " + string;
}