var path = require('path');

exports.casedFileCheck = function(refDirName, files, filepath) {
  var found = false;

  for (var f = 0; f < files.length; f++) {
    var dirFile = path.resolve(refDirName, files[f]);
    
    if (filepath === dirFile) {
        return true;
    }
  }

  return found;
};