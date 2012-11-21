var fs = require('fs'),
    path = require('path'),
    util = require("util");

var cheerio = require('cheerio'),
    wrench = require('wrench'),
    teacher = require('teacher');

var helpers = require('../helpers');

exports.checkMissingImage = function(filename, $, options, callback) {
    var errors = [];
    var imgList = $("img");

    if (imgList !== undefined) {
        for (var i = 0; i < imgList.length; i++) {
            var src = $(imgList[i]).attr("src");

            if (src === undefined || src.length === 0) {
                errors.push(filename, printMessage("Missing src attribute"));//, l, lines[l]));
            }
            else if (!src.match(/www/) && !src.match(/https?:/)) {
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

                if (options.remap && options.remap.images[refDirName] !== undefined) {
                    var remappedRef = options.remap.images[refDirName];
                    if (remappedRef == "ignore")
                        return true;
                    refDirName = remappedRef;
                }
                if (options.remap && options.remap.images[refFileName] !== undefined) {
                    var remappedRef = options.remap.images[refFileName];
                    if (remappedRef == "ignore")
                        return true;
                    refFileName = remappedRef;
                }
                
                if (!path.existsSync(refDirName + "/" + refFileName)) {
                    errors.push(printMessage(filename,  "image " + src + " does not exist"));
                }
                else {
                    var files = wrench.readdirSyncRecursive(refDirName);
                    var fileExists = helpers.casedFileCheck(refDirName, files, filepath);
                    
                    if (!fileExists) {
                        errors.push(printMessage(filename, "image " + src + " does not exist (due to case sensitivity)"));//, l, lines[l]));
                    }
                }
            }
        }
    }

    callback(errors);
};

exports.checkBrokenLocalLink = function(filename, $, readFiles, options, callback) {
    var errors = [];
    var aList = $("a");

    if (aList !== undefined) {
        for (var i = 0; i < aList.length; i++) {
            var href = $(aList[i]).attr("href");

            if (href !== undefined && href.length > 0) {
                if (options.remap && options.remap.links[href] !== undefined)
                    continue;
                // not an external link, or ignorable link (/,, #)
                if (!href.match(/www/) && 
                    !href.match(/https?:/) && 
                    !href.match(/^mailto:/) && 
                    href !== '/' && 
                    href != '#' && 
                    href != 'javascript:void(0)')  {
                    var filepath = path.resolve(path.dirname(filename) + "/"  + href);
                
                    if (href.match(/\#/)) { // a reference to somewhere internal
                        var hashFile = href.substr(0, href.indexOf("#"));
                        var hashId = href.substr(href.indexOf("#") + 1); 

                        // there's a different file associated with the hash
                        if (hashFile.length > 0) {
                            filepath = path.resolve(path.dirname(filename) + "/"  + hashFile);
                            
                            // check if file exists first
                            if (fileCheck(options, hashFile, filename, filepath, false, errors)) {
                                // console.log(hashFile + " is legit. Let's check " + hashId);
                                // then, validate the hash ref
                            
                                var hashFileDir = path.dirname(hashFile);
                                if (options.remap && options.remap.links[hashFileDir] !== undefined)
                                    filepath = options.remap.links[hashFileDir] + "/" + hashFile.replace(hashFileDir, "");
                                    
                                // prevent too many files from being read--just see if the content exists already
                                var hash$ = readFiles[filepath];
                                
                                if (hash$ == undefined) {
                                    var content = fs.readFileSync(filepath, 'utf8');
                                    hash$ = cheerio.load(content);
                                    readFiles[filepath] = hash$;
                                }

                                hashId = hashId.replace(/\./g, "\\.");
                                var hashElement = hash$("#" + hashId);
                                var hashName = hash$("[name=" + hashId + "]");
                                    
                                // do the actual check (finally!)
                                if (hashElement.length <= 0 && hashName.length <= 0) {
                                    errors.push(printMessage(filename, filepath + " has an incorrect internal hash to '#" + hashId +"'"));
                                }
                                else {
                                    //console.log("Yes, " + hashFile + "#" + hashId + " is okay.");
                                }
                            } 
                            else {
                                errors.push(printMessage(filename, "found an external hash to a file that doesn't exist (" + filepath + ")"));
                            }
                        } 
                        else { // if the hash file doesn't exist, this is an internal hash (i.e. "href='#blah'")
                            if ($('#' + hashId) !== null) {
                                // checking the name and id attributes; I weep to do this twice
                                var foundName = false;
                                var links = $('a');
                          
                                var hashElement = $("#" + hashId);
                                var hashName = $("[name=" + hashId + "]");
                                if (hashElement === undefined && hashName === undefined) {
                                    errors.push(printMessage(filename, "found an an incorrect internal hash to '#" + hashId + "'"));
                                }
                            }
                            else {
                                //console.log("Yes, " + filename + "#" + hashId + " is okay.");
                            }
                        }
                    }
                    else {
                        fileCheck(options, href, filename, filepath, true, errors);
                    }
                }
            }
        }
    }

  callback(errors);
};

function fileCheck(options, href, file, filepath, noHash, errors)
{
    var found = false;
    var lastSlashPos = href.lastIndexOf("/");
    var refDirName = href.substr(0, lastSlashPos);
    var refFileName = href.substr(lastSlashPos + 1);

    if (refDirName.length === 0 || lastSlashPos < 0) {
        refDirName = path.dirname(filepath);
    }

    refDirName = path.resolve(path.dirname(file), refDirName);
    if (options.remap && options.remap.links[refDirName] !== undefined) {
        var remappedRef = options.remap.links[refDirName];
        if (remappedRef == "ignore")
            return true;
        refDirName = remappedRef;
    }

    if (options.remap && options.remap.links[refFileName] !== undefined) {
        var remappedRef = options.remap.links[refFileName];
        if (remappedRef == "ignore")
            return true;
        refFileName = remappedRef;
    }
    
    if (!path.existsSync(refDirName)) {
        errors.push(printMessage(file, " trying to link to " + refDirName + ", which isn't a directory"));
        return false;
    }

    if (!path.existsSync(refDirName + "/" + refFileName)) {   
        errors.push(printMessage(file, " trying to incorrectly link to " + href + " as " + filepath));
        return false;
    }
    
    if (noHash) {
        return true;
        var files = wrench.readdirSyncRecursive(refDirName);
        var fileExists = helpers.casedFileCheck(refDirName, files, filepath);

        if (!fileExists) {
            errors.push(printMessage(file, " trying to incorrectly link to " + href + " (due to case sensitivity) as " + filepath));
            return false;
        }
    }

    return true;
}

exports.checkSpelling = function(filename, $, options, callback) {
    var errors = [];

    // remove code nodes that likely have non-English words
    var _$ = $;
    _$('pre').remove();
    _$('code').remove();

    teacher.check(_$("body").text(), function(err, data) {
        if (data && data.length) {
            data.forEach(function (typo) {
                var ignore = false;
                if (options.safeWords && typo.type === "spelling") {
                    for (var s = 0, l = options.safeWords.length; s < l; s++) {   
                        if (options.safeWords[s] === typo.string) {
                            ignore = true;
                            break;
                        }
                    }
                }
                if (!ignore)
                    errors.push(printMessage(filename, " has a typo: " + util.inspect(typo, null, 2)));
            });
        }

        callback(errors);
    });
};

function printMessage(filename, msg, line, string) {
  return filename + ": " + msg;// + " around line " + line + ": " + string;
}