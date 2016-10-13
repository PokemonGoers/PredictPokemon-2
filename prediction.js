/**
 * Created by Benjamin on 07.10.2016.
 */
var exec = require('child-process-promise').exec;
var DC = require('./dataSet_creator.js').DC;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';

predict(48.17711, 11.61785, 0);

/*
 * Handle queries
 * 1. create location grid for query location
 * 2. create arff test file for every location with the same timestamp
 *     a. check if there is a new data set available from 'Prediction routine' if so use it
 *     b. add features for each location
 *     c. add co-occurrence by using the existing co-occurrence data
 * 3. run weka with the current classifier model to predict the data
 */

/*
 * Prediction routine
 * 1. create data set from API data
 *     a. collect 10k poke entries from API
  *    b. create features for each entry
  *    c. init co-occurrence
  *    d. add co-occurrence features for each entry
  *    f. store data set and return co-occurrence data
  * 2. update current data set with the newly created on
  * 3. start timer to jump to 1. when it triggers
 */

/*
 * DC init
 * 1. read config and sources
 * 2. create sources
 */

function predict(latitude, longitude, timestamp) {
    var wekaCmd = 'java -classpath ./data/weka.jar'; // add more RAM by option: -Xmx1024m
    //var classifier = 'weka.classifiers.bayes.NaiveBayes';
    var classifier = 'weka.classifiers.meta.Vote';
    var classifierOptions = '-S 1 -B "weka.classifiers.lazy.IBk -K 100 -W 0 -A \\"weka.core.neighboursearch.LinearNNSearch -A \\\\\\"weka.core.EuclideanDistance -R first-last\\\\\\"\\"" -B "weka.classifiers.bayes.BayesNet -D -Q weka.classifiers.bayes.net.search.local.K2 -- -P 1 -S BAYES -E weka.classifiers.bayes.net.estimate.SimpleEstimator -- -A 0.5" -R PROD';
    // no-cv: no cross-validation, v: no training data statistics
    var trainingOptions = '-no-cv -v -classifications "weka.classifiers.evaluation.output.prediction.Null"';
    // p <range>: print predictions and attribute values in range. if range = 0 print no attributes
    // specify the output format of the predictions. Use CSV for easier parsing and PlainText for pretty print.
    var testOptions = '-classifications "weka.classifiers.evaluation.output.prediction.CSV"';
    var modelName = 'data/classifier.model';
    var trainingData = 'data/trainingData.arff';
    var testData = 'data/testData.arff';

    DC.cooccClasses = [13, 16, 19, 96, 129];
    DC.init('prediction_feature_config.json', true);

    function getData(callback) {
        console.log('requesting ' +url);
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                var apiData = JSON.parse(xmlHttp.responseText);
                console.log('downloaded ' +apiData.data.length + ' sightings from API');
                callback(apiData.data);
            }
        };
        xmlHttp.open("GET", url, true);
        xmlHttp.send();
        return xmlHttp.responseText;
    }

    function createTrainingSet() {
        return new Promise(
            function(resolve, reject) {
                getData(function (data) {
                    DC.storeArffFile(data.slice(0, 100), trainingData, true, false);
                    resolve();
                });
            }
        );
    }

    /**
     * train model
     * java -classpath ./data/weka.jar -Xmx1024m weka.classifiers.bayes.NaiveBayes -t weather.arff -d weather-NB.model
     * @return {Array|{index: number, input: string}|*|Promise}
     */
    function trainModel() {
        var cmd = wekaCmd + ' ' + classifier + ' ' + classifierOptions + ' ' + trainingOptions
            + ' -t ' + trainingData     // training data to be used to create the model
            + ' -d ' + modelName;       // store the trained model with the specified name
        console.log('run command:\n' +cmd);
        return exec(cmd);
    }

    /**
     * test model
     * java -classpath ./data/weka.jar weka.classifiers.bayes.NaiveBayes -l weather-NB.model -T weather-test.arff
     * @return {Array|{index: number, input: string}|*|Promise}
     */
    function test() {
        var cmd = wekaCmd + ' ' + classifier + ' ' + testOptions
            + ' -l ' + modelName        // load the trained model with the specified name
            + ' -T ' + testData;        // test data to be evaluated by the trained model
        return exec(cmd, {maxBuffer: 1024 * 1024 * 2}); // 2MB
    }

    /**
     * parse the weka output and return an array of the predicted class label and the corresponding confidence
     * for all entries in the tested data set
     * @param wekaOutput
     * @return {Array} array of prediction objects which contain the class label and the corresponding confidence
     */
    function parsePredictionOutput(wekaOutput) {
        var predictions = [];

        var lines = wekaOutput.split('\n');
        if (lines.length > 5) {
            lines.slice(5, -2).forEach(function (line) {
                var components = line.split(',');
                predictions.push({
                    "classLabel": components[2].split(':')[1],
                    "confidence": components[4]
                });
            });
        }

        return predictions;
    }

    /**
     * create coordinates for a 9x9 grid with the given coordinate in the center
     * @param latitude
     * @param longitude
     */
    function createGridLocations(latitude, longitude) {
        const gridDistance = 0.25;  // 250m grid distance -> 2km for 9 grids from the center
        var locations = [];

        for(var dx = -4; dx <= 4; dx++) {
            for(var dy = -4; dy <= 4; dy++) {
                // from http://stackoverflow.com/a/7478827
                var new_latitude  = latitude  + (dy*gridDistance / 6371) * (180 / Math.PI);
                var new_longitude = longitude + (dx*gridDistance / 6371) * (180 / Math.PI) / Math.cos(latitude * Math.PI/180);
                locations.push({
                    "latitude": new_latitude,
                    "longitude": new_longitude
                });
            }
        }

        return locations;
    }

    function createPokeEntry(latitude, longitude, ts) {
        return {
            "pokemonId": DC.existingPokemonID,
            "appearedLocalTime": ts,
            "latitude": latitude,
            "longitude": longitude
        };
    }

    function createTestData(latitude, longitude, ts) {
        var locationGrid = createGridLocations(latitude, longitude);
        var pokeEntries = [];

        locationGrid.forEach(function (location) {
            pokeEntries.push(createPokeEntry(location.latitude, location.longitude, ts));
        });

        DC.storeArffFile(pokeEntries, testData, false, true);
    }

    createTrainingSet()
        .then(function (result) {
            console.log('-- train model');
            var promise = trainModel();
            console.log('-- created model');
            return promise;
        })
        .then(function (result) {
            if (result.stderr) {
                console.log('-- train stderr: ' + result.stderr);
            }
            console.log('-- create test data');
            createTestData(longitude, latitude, new Date().toJSON());
            console.log('-- evaluate test data');
            return test()
        })
        .then(function (result) {
            if (result.stderr) {
                console.log('-- test stderr: ' + result.stderr);
            }
            console.log('-- test completed');
            // console.log('-- test stderr: ' + result.stderr);
            // console.log('-- test stdout: ' + result.stdout);
            var predictions = parsePredictionOutput(result.stdout);
            predictions.forEach(function (prediction) {
                console.log('class: ' + prediction.classLabel + ', confidence: ' +prediction.confidence);
            })
        })
        .catch(function (err) {
            console.error('ERROR: ', err);
        });

    // trainModel()
    //     .then(function (result) {
    //         console.log('-- training completed');
    //         // console.log('-- train stderr: ' + result.stderr);
    //         // console.log('-- train stdout: ' + result.stdout);
    //         return test();
    //     })
    //     .then(function (result) {
    //         console.log('-- test completed');
    //         // console.log('-- test stderr: ' + result.stderr);
    //         console.log('-- test stdout: ' + result.stdout);
    //         var predictions = parsePredictionOutput(result.stdout);
    //         predictions.forEach(function (prediction) {
    //             console.log('class: ' + prediction.classLabel + ', confidence: ' +prediction.confidence);
    //         })
    //     })
    //     .catch(function (err) {
    //         console.error('ERROR: ', err);
    //     });

    // call test only if the model was already trained
    // test()
    //     .then(function (result) {
    //         console.log('-- test completed');
    //         console.log('-- test stderr: ' + result.stderr);
    //         console.log('-- test stdout: ' + result.stdout);
    //     })
    //     .catch(function (err) {
    //         console.error('ERROR: ', err);
    //     });
}