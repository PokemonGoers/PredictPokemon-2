var fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';

var destination = 'arff/apiData.arff';

httpGetAsync(url, destination);

function httpGetAsync(url, destination) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var apiData = JSON.parse(xmlHttp.responseText);
            jsonToArff(apiData, 'apiData', destination);
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
    return xmlHttp.responseText;
}

function jsonToArff(json_data, fileName, destination) {
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