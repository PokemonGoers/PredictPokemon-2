/**
 * Created by matt on 22.09.16.
 */
var fs = require('fs');
var DC = require('./dataSet_creator.js').DC;
var source = 'json/pokeDump_2_sorted.json';
var destination = 'arff/dataDump_50k_sorted.arff';

processDump(source, 0, 50);

/**
 * take the data dump and add features to get an arff file
 * @param _source json file to use
 * @param from_line starting this line in the file
 * @param number_lines finishing on this line in the file
 */
function processDump(_source, from_line, number_lines) {
    var data;
    try {
        data = fs.readFileSync(_source, 'utf8');
    } catch (err) {
        console.log(err);
    }
    try {
        var jsonData = JSON.parse(data);
    } catch (err) {
        console.log(err);
    }
    console.log('Read ' + jsonData.length + ' from file');
    var data_less = jsonData.slice(from_line, from_line+number_lines);
    console.log('Sliced to ' + data_less.length + ' entries');
    DC.init("feature_config.json", false);
    DC.storeArffFile(data_less, destination, false);
}