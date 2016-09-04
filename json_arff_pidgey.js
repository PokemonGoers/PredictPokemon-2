var fs = require('fs');

var source = ['json/dummy1.json', 'json/dummy2.json',
                'json/dummy3.json', 'json/dummy4.json'];
var destination = 'arff/dummy_pidgey.arff';
var pokemonId = 16;

var arff = ArrayJsonToArff(source, pokemonId);
fs.writeFileSync(destination, arff, 'utf8');

function ArrayJsonToArff(source, pokemonId) {
    var arff = '@RELATION ' + getFileName(source[0]) + '\n' + '\n';

    // attributes
    arff += '@ATTRIBUTE timestamp numeric\n';
    arff += '@ATTRIBUTE latitude numeric\n';
    arff += '@ATTRIBUTE longitude numeric\n';

    //class
    arff += '@ATTRIBUTE class {+1,-1}\n\n';

    //data
    arff += '@DATA\n';

    source.forEach(function (file) {
        arff += jsonToArff(fileToJson(file));
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

function fileToJson(path) {
    var data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data);
}

function jsonToArff(jsonData) {
    var arff = '';
    jsonData.forEach(function (element) {
        arff += getMinutesSinceNoon(element['created']) + ',';
        arff += element['latitude'] + ',';
        arff += element['longitude'] + ',';
        arff += isPokemonId(pokemonId, element['pokemonId']) + '\n';
    });
    return arff;
}
