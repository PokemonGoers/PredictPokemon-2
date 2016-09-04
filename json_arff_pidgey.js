var fs = require('fs');

var sources = ['json/dummy1.json', 'json/dummy2.json', 'json/dummy3.json', 'json/dummy4.json'];
var destination = 'arff/dummy.arff';

filesToArff(sources, destination, 'pokemonId');

/**
 * convert several files into one .arff file
 * @param sources array of relative file paths
 * @param destionation relative destination path
 * @param classKey the key of the class label, which is used in the files
 */
function filesToArff(sources, destionation, classKey) {
    var splitedFileName = sources[0].split('/');
    splitedFileName = splitedFileName[splitedFileName.length-1];
    splitedFileName = splitedFileName.split('.');
    var fileName = splitedFileName[0];

    var json_data = filesTojson(sources);
    jsonToArff(json_data, classKey, fileName, destination);
}

/**
 * convert an array of files into a single JSON array
 * @param sources array of relative file paths
 * @returns {Array} of file contains in JSON format
 */
function filesTojson(sources) {
    var json_data = [];

    sources.forEach(function (file) {
        var data = fs.readFileSync(file, 'utf8');
        json_data = json_data.concat(JSON.parse(data));
    });

    return json_data;
}

/**
 * Convert a JSON into an .arff file
 * @param json_data array which contains the data for the .arff file
 * @param classKey the key of the class label, which is used in the data
 * @param fileName the relation name which will be written into the .arff file
 * @param destination the relative file path where the .arff will be sotred.
 */
function jsonToArff(json_data, classKey, fileName, destination) {
    var classLabels = allValuesForKeyInData(classKey, json_data);
    var arff = '';
    arff = arff + '@RELATION ' + fileName + '\n' + '\n';

    var firstElement = json_data[0];
    for (var key in firstElement) {
        if (key !== classKey) {
            if (typeof firstElement[key] === 'string') {
                arff = arff + '@ATTRIBUTE ' + key + ' string\n';
            }
            if (typeof firstElement[key] === 'number'
                || typeof firstElement[key] === 'boolean') {
                arff = arff + '@ATTRIBUTE ' + key + ' numeric\n';
            }
        }
    }
    arff = arff + '@ATTRIBUTE class {' + classLabels.join(', ') + '}\n\n';

    arff = arff + '@DATA\n';
    for (var i = 0; i < json_data.length; i++) {
        var element = json_data[i];
        for (var key in element) {
            if (key !== classKey) {
                if (typeof element[key] === 'string') {
                    arff = arff + element[key].replace(/\s+/g, '') + ',';
                } else {
                    arff = arff + element[key] + ',';
                }
            }
        }
        arff = arff + element[classKey] + '\n';
    }

    fs.writeFileSync(destination, arff, 'utf8');
}

/**
 * get all distinct values for the specified key in the provided data array
 * @param key the key for which the values hsould be returned
 * @param json_data array of data
 * @returns {Array} all distinct values in the data for the specified key
 */
function allValuesForKeyInData(key, json_data) {
    var values = [];

    json_data.forEach(function (row) {
        values.push(row[key]);
    });

    return Array.from(new Set(values));
}