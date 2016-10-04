var data = require('./getApiData');
var weka = require('node-weka');

var destination = 'arff/apiDataExtended.arff';
var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';

function startPrediction() {
    var options = {
        'classifier': 'weka.classifiers.bayes.BayesNet',
        'params': ''
    };

    data.get(url, destination, function predict() {
        weka.classify(data, testData, options, function (err, result) {

        });
    });
}


module.exports = {predict: startPrediction};