var fs = require('fs');
var DS = require('./dataSet_creator.js').DC;
var source = 'json/pokeDump_2.json';
var destination = 'arff/dataDump_50k_training.arff';

processDump(source, 0, 50000);

function processDump(_source, from_line, number_lines) {
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
    var data_less = apiData.slice(from_line, from_line+number_lines);
    console.log('Sliced to ' + data_less.length + ' entries');
    DS.storeArffFile('feature_config.json', data_less, destination);
}