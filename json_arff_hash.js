var fs = require('fs');
var crypto = require('crypto');
var hash = crypto.createHash('sha256');

var sources = [
    'json/dummy1.json',
    'json/dummy2.json',
    'json/dummy3.json',
    'json/dummy4.json'];

var destination = 'arff/pokeDummyData_numeric.arff';

filesToArff(sources, destination, 'pokemonId');

function filesToArff(sources, destination, classKey) {
    var splitedFileName = sources[0].split('/');
    splitedFileName = splitedFileName[splitedFileName.length - 1];
    splitedFileName = splitedFileName.split('.');
    var fileName = splitedFileName[0];

    var json_data = filesTojson(sources);
    jsonToArff(json_data, classKey, fileName, destination);
}


function filesTojson(sources) {
    var json_data = [];

    sources.forEach(function (file) {
        var data = fs.readFileSync(file, 'utf8');
        json_data = json_data.concat(JSON.parse(data));
    });

    return json_data;
}

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
                || typeof firstElement[key] === 'boolean') {
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
                    hash = crypto.createHash('sha256');
                    hash.update(element[key]);
                    arff = arff + parseInt('0x' + hash.digest('hex'), 'hex') + ',';
                } else {
                    arff = arff + element[key] + ',';
                }
            }
        }
        arff = arff + element[classKey] + '\n';
    }

    fs.writeFileSync(destination, arff, 'utf8');
}


function allValuesForKeyInData(key, json_data) {
    var values = [];

    json_data.forEach(function (row) {
        values.push(row[key]);
    });

    return Array.from(new Set(values));
}
