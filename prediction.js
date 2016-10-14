/**
 * Created by Benjamin on 07.10.2016.
 */
var exec = require('child-process-promise').exec;
var DC = require('./dataSet_creator.js').DC;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';

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

const wekaCmd = 'java -classpath ./data/weka.jar'; // add more RAM by option: -Xmx1024m
const classifier = 'weka.classifiers.meta.Vote';
const classifierOptions = '-S 1 -B "weka.classifiers.lazy.IBk -K 100 -W 0 -A \\"weka.core.neighboursearch.LinearNNSearch -A \\\\\\"weka.core.EuclideanDistance -R first-last\\\\\\"\\"" -B "weka.classifiers.bayes.BayesNet -D -Q weka.classifiers.bayes.net.search.local.K2 -- -P 1 -S BAYES -E weka.classifiers.bayes.net.estimate.SimpleEstimator -- -A 0.5" -R PROD';
// no-cv: no cross-validation, v: no training data statistics
const trainingOptions = '-no-cv -v -classifications "weka.classifiers.evaluation.output.prediction.Null"';
// p <range>: print predictions and attribute values in range. if range = 0 print no attributes
// specify the output format of the predictions. Use CSV for easier parsing and PlainText for pretty print.
const testOptions = '-classifications "weka.classifiers.evaluation.output.prediction.CSV"';
const trainingData = 'data/trainingData.arff';
const testData = 'data/testData.arff';

var activeModelName = 'data/classifier1.model';
var trainingModelName = 'data/classifier2.model';
var coocTrainingData = null;
var newCoocTrainingData = null;

console.log('started prediction script, init DC');
DC.consoleOn = false;
DC.cooccClasses = [13, 16, 19, 96, 129];
DC.init('prediction_feature_config.json', true);

var switchClassifierModel = false;
retrainClassifier();
// var retrainTimer = setInterval(retrainClassifier, 1000 * 10);//60 * 15);
var testTimer = setInterval(testClassifier, 1000);//60 * 15);

function testClassifier() {
    predict(48.17711, 11.61785, 0)
        .then(function (result) {
            console.log(new Date().toJSON() + ' predicted ' + result.length + ' entries, first:'
                +JSON.stringify(result[0]));
        })
        .catch(function (err) {
            console.log('Error: ' + err);
        });
    // predict(48.17711 + Math.random(), 11.61785 + Math.random(), 0);
}

function predict(latitude, longitude, timestamp) {
    return new Promise(
        function(resolve, reject) {
            if (switchClassifierModel) {
                var temp = activeModelName;
                activeModelName = trainingModelName;
                trainingModelName = temp;
                coocTrainingData = newCoocTrainingData;
                newCoocTrainingData = null;
                switchClassifierModel = false;
            }
            if (coocTrainingData === null) {
                reject('no cooc data');
            }

            var pokeEntries = createTestData(longitude, latitude, new Date().toJSON());
            test()
                .then(function (result) {
                    var predictions = parsePredictionOutput(result.stdout);

                    for(var i=0; i<predictions.length; i++) {
                        var prediction = predictions[i];
                        var pokeEntry = pokeEntries[i];
                        prediction.latitude = pokeEntry.latitude;
                        prediction.longitude = pokeEntry.longitude;
                    }

                    resolve(predictions);
                })
                .catch(function (err) {
                    reject(err);
                });
        }
    );
}

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
                var cooc = DC.storeArffFile(data.slice(0, 1000), trainingData, true, null);
                resolve(cooc);
            });
        }
    );
}

function retrainClassifier(callback) {
    var cooc = null;
    createTrainingSet()
        .then(function (result) {
            console.log('-- train classifier model');
            cooc = result;
            var promise = trainModel();
            console.log('-- created classifier model');
            return promise;
        })
        .then(function (result) {
            switchClassifierModel = true;
            newCoocTrainingData = cooc;
            if (callback !== undefined && callback !== null) {
                callback(cooc);
            }
        })
        .catch(function (err) {
            console.error('ERROR in retrain: ', err);
        });
}

/**
 * train model
 * java -classpath ./data/weka.jar -Xmx1024m weka.classifiers.bayes.NaiveBayes -t weather.arff -d weather-NB.model
 * @return {Array|{index: number, input: string}|*|Promise}
 */
function trainModel() {
    var cmd = wekaCmd + ' ' + classifier + ' ' + classifierOptions + ' ' + trainingOptions
        + ' -t ' + trainingData     // training data to be used to create the model
        + ' -d ' + trainingModelName;       // store the trained model with the specified name
    return exec(cmd);
}

/**
 * test model
 * java -classpath ./data/weka.jar weka.classifiers.bayes.NaiveBayes -l weather-NB.model -T weather-test.arff
 * @return {Array|{index: number, input: string}|*|Promise}
 */
function test() {
    var cmd = wekaCmd + ' ' + classifier + ' ' + testOptions
        + ' -l ' + activeModelName  // load the trained model with the specified name
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
                "pokemonId": components[2].split(':')[1],
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
    // from http://stackoverflow.com/a/7478827
    // new_latitude  = latitude  + (dy*gridDistance / 6371) * (180 / Math.PI);
    // new_longitude = longitude + (dx*gridDistance / 6371) * (180 / Math.PI) / Math.cos(latitude * Math.PI/180);
    const latitudeFactor = (gridDistance / 6371) * (180 / Math.PI);
    const longitudeFactor = latitudeFactor / Math.cos(latitude * Math.PI/180);

    for(var dx = -4; dx <= 4; dx++) {
        for(var dy = -4; dy <= 4; dy++) {
            locations.push({
                "latitude": latitude + dy * latitudeFactor,
                "longitude": longitude + dx * longitudeFactor
            });
        }
    }

    return locations;
}

function createPokeEntry(latitude, longitude, ts) {
    return {
        "pokemonId": 151, // dummy id
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

    DC.storeArffFile(pokeEntries, testData, false, coocTrainingData);
    return pokeEntries;
}

    // createTrainingSet()
    //     .then(function (result) {
    //         console.log('-- train model');
    //         var promise = trainModel();
    //         console.log('-- created model');
    //         return promise;
    //     })
    //     .then(function (result) {
    //         if (result.stderr) {
    //             console.log('-- train stderr: ' + result.stderr);
    //         }
    //         console.log('-- create test data');
    //         createTestData(longitude, latitude, new Date().toJSON());
    //         console.log('-- evaluate test data');
    //         return test()
    //     })
    //     .then(function (result) {
    //         if (result.stderr) {
    //             console.log('-- test stderr: ' + result.stderr);
    //         }
    //         console.log('-- test completed');
    //         // console.log('-- test stderr: ' + result.stderr);
    //         // console.log('-- test stdout: ' + result.stdout);
    //         var predictions = parsePredictionOutput(result.stdout);
    //         predictions.forEach(function (prediction) {
    //             console.log('class: ' + prediction.classLabel + ', confidence: ' +prediction.confidence);
    //         })
    //     })
    //     .catch(function (err) {
    //         console.error('ERROR: ', err);
    //     });

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