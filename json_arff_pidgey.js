var fs = require('fs');

var source = 'json/dummy1.json';
var destination = 'arff/my_test_dummy.arff';
var pokemonId = 16;

var data = fs.readFileSync(source, 'utf8');
data = JSON.parse(data);
var arff = jsonToArff(data, getFileName(source), pokemonId);
fs.writeFileSync(destination, arff, 'utf8');

function jsonToArff(json_data, fileName, pokemonId) {
    var arff = '@RELATION ' + fileName + '\n' + '\n';

    // attributes
    arff += '@ATTRIBUTE timestamp numeric\n';
    arff += '@ATTRIBUTE latitude numeric\n';
    arff += '@ATTRIBUTE longitude numeric\n';

    //class
    arff += '@ATTRIBUTE class {+1, -1}\n\n';

    //data
    arff += '@DATA\n';

    json_data.forEach(function (element) {
        arff += getMinutesSinceNoon(element['created']) + ',';
        arff += element['latitude'] + ',';
        arff += element['longitude'] + ',';
        arff += isPokemonId(pokemonId, element['pokemonId']) + '\n';
    });

    return arff;
}

function getFileName(path) {
    var splitedFileName = path.split('/');
    splitedFileName = splitedFileName[splitedFileName.length-1];
    splitedFileName = splitedFileName.split('.');
    return splitedFileName[0];
}

function getMinutesSinceNoon(seconds) {
    var date = new Date(seconds*1000);
    return date.getHours()*60 + date.getMinutes();
}

function isPokemonId(pokemonId, id) {
    if (pokemonId === id) {
        return '+1';
    } else {
        return '-1';
    }
}
