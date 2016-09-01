var fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';

var destination = 'arff/apiData.arff';

httpGetAsync(url, destination, 'pokemonID');

function httpGetAsync(url, destination, classKey) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var apiData = JSON.parse(xmlHttp.responseText);
            jsonToArff(apiData, classKey, 'apiData', destination);
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
    return xmlHttp.responseText;
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
                if (key === "location" && element[key] !== null) {
                    arff = arff + element[key]["coordinates"][0] + ',';
                    arff = arff + element[key]["coordinates"][1] + ',';

                } else {
                    if (typeof element[key] === 'string') {
                        arff = arff + element[key].replace(/\s+/g, '') + ',';
                    } else {
                        arff = arff + element[key] + ',';
                    }
                }
            }
        }
        arff = arff + element[classKey] + '\n';
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