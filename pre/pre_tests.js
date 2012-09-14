var util = require("util");
var http = require("http");
var async = require('async');
var url = require('url');

exports.checkMissingAltTag = function(filename, $, options, callback) {
	var errors = [];
	var imgList = $("img");

    if (imgList !== undefined) {
    	for (var i = 0; i < imgList.length; i++) {
    		var alt = $(imgList[i]).attr("alt");

    		if (alt === undefined || alt.length == 0) {
    			errors.push(printMessage("Image " + $(imgList[i]).attr("src") + " has a missing alt attribute", filename));//, l, lines[l]));
    		}
    	}
    }

  callback(errors);
};

exports.checkBrokenExternalLink = function(filename, $, options, callback) {
	var errors = [];
	var aList = $("a");

    if (aList !== undefined) {
    	async.forEach(aList, function(el, cb) {
    		var href = $(el).attr("href");

            if (href === undefined) {
                errors.push(printMessage("Anchor " + $(el) + " has a missing href attribute", filename));
            }
    		else if (href.match(/www/) || href.match(/http:/) || href.match(/https:/)) {
    			var parsedUrl = url.parse(href);
                //console.log("An external URL is: " + href);
    			/*var options = {
				  host: parsedUrl.hostname || parsedUrl.pathname,
				  port: 80
				};

				http.get(options, function(res) {
				  if (res.statusCode != 200) {
				  	errors.push(printMessage("URL " + href + " does not exist", filename));
                    cb(null);
				  }
				}).on('error', function(e) {
					errors.push(printMessage("URL " + href + " does not exist", filename));
                    cb(null);
				});*/
    		}
    	}, callback(errors));
    }
};

function printMessage(msg, filename, line, string) {
  return msg + " in " + filename;// + " around line " + line + ": " + string;
};