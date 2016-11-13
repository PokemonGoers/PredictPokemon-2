var unzip = require('unzip');
var fs = require('fs');
var fstream = require('fstream');
var path = require('path');

var zipFiles = [
    {
        "path": '/../json',
        "file": '/pokestop_groups.zip'
    },
    {
        "path": '/../json',
        "file": '/pokestops.zip'
    }
];

function unzipFiles(zips) {
    if (zips == null || zips.length == 0) {
        console.log('unzipped all files');
        return;
    }

    var zip = zips.shift();
    var readStream = fs.createReadStream(path.join(__dirname, zip.path + zip.file));
    var writeStream = fstream.Writer(path.join(__dirname, zip.path));
    readStream
        .pipe(unzip.Parse())
        .pipe(writeStream)
        .on('close', function() {
            console.log('unzipped ' + zip.file);
            unzipFiles(zips);
        });
}

console.log('start to unzip ' + zipFiles.length + ': files');
unzipFiles(zipFiles);