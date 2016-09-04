var fs = require('fs');

var source = ['json/dummy1.json', 'json/dummy2.json',
                'json/dummy3.json', 'json/dummy4.json'];
var destination = 'arff/dummy_pidgey.arff';
var pokemonId = 16;

var arff = ArrayJsonToArff(source, pokemonId);
fs.writeFileSync(destination, arff, 'utf8');

/**
 * parses the array of json files to one arff file with pokemonId as class
 * @param source which is an array if file paths
 * @param pokemonId which will be the class
 * @returns the arff string
 */
function ArrayJsonToArff(source, pokemonId) {
    var arff = '@RELATION ' + getFileName(source[0]) + '\n' + '\n';

    // attributes
    arff += '@ATTRIBUTE timestamp numeric\n';
    arff += '@ATTRIBUTE minutesSinceNoon numeric\n';
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

/**
 * get the file name of the path
 * @param path of file
 * @returns file name as string
 */
function getFileName(path) {
    var splitedFileName = path.split('/');
    splitedFileName = splitedFileName[splitedFileName.length-1];
    splitedFileName = splitedFileName.split('.');
    return splitedFileName[0];
}

/**
 * get the minutes since noon from a date
 * @param seconds since unix time
 * @returns minutes since noon
 */
function getMinutesSinceNoon(seconds) {
    var date = new Date(seconds*1000);
    return date.getHours()*60 + date.getMinutes();
}

/**
 * checks if pokemonId is equal to id of appeared pokemon
 * @param pokemonId
 * @param id of pokemo
 * @returns +1 if true and -1 if false
 */
function isPokemonId(pokemonId, id) {
    if (pokemonId === id) {
        return '+1';
    } else {
        return '-1';
    }
}

/**
 * reads file and parses it to json
 * @param path to file
 * @returns json data
 */
function fileToJson(path) {
    var data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data);
}

/**
 * parses one json file to an arff string
 * @param json data from file
 * @returns arff as string
 */
function jsonToArff(jsonData) {
    var arff = '';
    jsonData.forEach(function (element) {
        arff += element['created'] + ',';
        arff += getMinutesSinceNoon(element['created']) + ',';
        arff += element['latitude'] + ',';
        arff += element['longitude'] + ',';
        arff += isPokemonId(pokemonId, element['pokemonId']) + '\n';
    });
    return arff;
}
