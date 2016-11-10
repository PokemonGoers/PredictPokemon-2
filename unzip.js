(function (exports) {
    var unzip = require('unzip');
    var fs = require('fs');
    var fstream = require('fstream');

    exports.unzipFiles = function unzipFiles() {
        var fileArray = [
            '/arff/dataDump_50k_sorted.arff',
            '/json/pokeDump_2_sorted.json',
            '/json/pokestop_groups.json',
            '/json/pokestops.json'];
        var zipArray = [
            '/arff/dataDump_50k_sorted.zip',
            '/json/pokeDump_2_sorted.zip',
            '/json/pokestop_groups.zip',
            '/json/pokestops.zip'];
        var pathArray = [
            '/arff/', '/json/', '/json/', '/json/'];
        var fileNotFound = false;
        try {
            var exists = fs.readFileSync(__dirname+fileArray[0]);
            if (exists != undefined) console.log("File found");////to be deleted
        } catch (error) {
            //console.error(error);////to be deleted
            console.log("File not found, unzipping");////to be deleted
            fileNotFound = true;
        } finally {
            if (fileNotFound) {
                unzip_file(zipArray, pathArray, fileArray, checkSuccess, fileArray.length, 0);
            }
        }
    }

    function unzip_file(zip, path, file, check, size, i) {
        var readStream = fs.createReadStream(__dirname+zip[i]);
        var writeStream = fstream.Writer(__dirname+path[i]);
        readStream.pipe(unzip.Parse()).pipe(writeStream);
        writeStream.on('close', function () {
            check(__dirname+file[i]);
            if ((i + 1) < size)
                unzip_file(zip, path, file, check, size, (i + 1));
            //else do_stuff();
        });
        console.log("File " + file[i] + " extracted to " + path[i]);
    }

    function checkSuccess(file) {
        try {
            var test = fs.readFileSync(file);
            if (test != undefined) {
                console.log("Unzipping succeeded.");
                return true;
            }
        }
        catch (error) {
            console.log("!!!!! Unzipping failed!!!!! =(\n");
            return false;
        }
    }
})('undefined' !== typeof module ? module.exports : window);