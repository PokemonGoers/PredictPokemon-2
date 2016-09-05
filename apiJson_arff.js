var fs = require('fs');


var destination = 'arff/apiData.arff';
var source = 'json/apiData.json';

jsonToArff(source, 'apiData', destination);

function jsonToArff(source, fileName, destination) {
    var json_data = fs.readFileSync(source, 'utf8');
    json_data = JSON.parse(json_data);
    var valid_data = removeIncompleteData(json_data);
    var arff = '@RELATION ' + fileName + '\n\n';

    // attributes
    arff += '@ATTRIBUTE _id string\n';
    arff += '@ATTRIBUTE source string\n';
    arff += '@ATTRIBUTE latitude numeric\n';
    arff += '@ATTRIBUTE longitude numeric\n';
    arff += '@ATTRIBUTE appearedOn numeric\n';
    arff += '@ATTRIBUTE __v numeric\n';

    // class
    var classKey = 'pokemonId';
    var classLabels = allValuesForKeyInData(classKey, valid_data);
    arff += '@ATTRIBUTE class {' + classLabels.join(', ') + '}\n\n';

    // data
    arff += '@DATA\n';
    valid_data.forEach(function (element) {
        arff += element["_id"].replace(/\s+/g, '') + ',';
        arff += element["source"].replace(/\s+/g, '') + ',';
        arff += element["location"]["coordinates"][0] + ',';
        arff += element["location"]["coordinates"][1] + ',';
        arff += Date.parse(element["appearedOn"]) + ',';
        arff += element["__v"] + ',';
        arff += element[classKey] + '\n';
    });

    fs.writeFileSync(destination, arff, 'utf8');
}

/**
 * remove data entries which do not provided all required features
 * @param json_data data to filter
 * @returns {Array} array which contains only entries which provide all necessary features
 */
function removeIncompleteData(json_data) {
    var complete_data = [];

    json_data.forEach(function (element) {
        if (element["location"] !== null) {
            complete_data.push(element);
        }
    });

    return complete_data;
}

function allValuesForKeyInData(key, json_data) {
    var values = [];

    json_data.forEach(function (row) {
        values.push(row[key]);
    });

    return Array.from(new Set(values));
}