/**
 * Created by aurel on 02-Sep-16.
 */
var fs = require('fs');

var source = 'json/convertedTimeApi.json';
var destination = 'arff/apiData.arff';

dataToArff(source, destination, 'pokemonID');

function dataToArff(source, destination, classKey) {
    var json_data = fileTojson(source);
    jsonToArff(json_data, classKey, 'apiData', destination);
}

function fileTojson(source) {
    var json_data = [];

    var data = fs.readFileSync(source, 'utf8');
    json_data = json_data.concat(JSON.parse(data));

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
        if (element["location"] !== null) {
            // for (var key in element) {
            //     if (key !== classKey) {
            //         if (key === "location" && element[key] !== null) {
            //             arff = arff + element[key]["coordinates"][0] + ',';
            //             arff = arff + element[key]["coordinates"][1] + ',';
            //
            //         } else {
            //             if (typeof element[key] === 'string') {
            //                 arff = arff + element[key].replace(/\s+/g, '') + ',';
            //             } else {
            //                 arff = arff + element[key] + ',';
            //             }
            //         }
            //     }
            // }

            arff = arff + element["_id"].replace(/\s+/g, '') + ',';
            arff = arff + element["source"].replace(/\s+/g, '') + ',';
            arff = arff + element[key]["coordinates"][0] + ',';
            arff = arff + element[key]["coordinates"][1] + ',';
            arff = arff + element["appearedOn"] + ',';
            arff = arff + element["__v"] + ',';
            arff = arff + element[classKey] + '\n';
        }
    }

    fs.writeFileSync(destination, arff, 'utf8');
}


function getProperty(json, path) {
    var tokens = path.split(".");
    var obj = json;
    for (var i = 0; i < tokens.length; i++) {
        obj = obj[tokens[i]];
    }
    return obj;
}

function allValuesForKeyInData(key, json_data) {
    var values = [];

    json_data.forEach(function (row) {
        values.push(row[key]);
    });

    return Array.from(new Set(values));
}


module.exports.dataToArff = dataToArff;