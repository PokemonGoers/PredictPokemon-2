var fs = require('fs');
var DS = require('./dataSet_creator.js').DC;
var source = 'json/pokeDump_2.json';
var destination = 'arff/dataDump.arff';

processDump(source);

function processDump(_source) {
    var data;
    try {
        data = fs.readFileSync(source, 'utf8');
    } catch (err) {
        console.log(err);
    }
    try {
        var apiData = JSON.parse(data);
    } catch (err) {
        console.log(err);
    }
    console.log('Read ' + apiData.length + ' from file');
    DS.storeArffFile('feature_config.json', apiData, destination);
}