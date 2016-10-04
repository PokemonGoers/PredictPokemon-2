var data = require('./getApiData');
var weka = require('node-weka');

var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';
var destination = 'arff/apiDataExtended.arff';

function startPrediction() {

    data.get(url, destination, function () {
        var data = destination;

        var options = {
            'classifier': 'weka.classifiers.bayes.BayesNet',
            'params': ''
        };

        weka.classify(data, testData, options, function (err, result) {
        });
    });
}

module.exports = {predict: startPrediction};