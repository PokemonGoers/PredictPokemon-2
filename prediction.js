/**
 * Created on 07.10.2016.
 */
(function (exports) {
    var exec = require('child-process-promise').exec;
    var DC = require(__dirname + '/dataSet_creator.js').DC;
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting';

    var predictor = exports.predictor = {};
    // the base url to the pokeData API for sightings: http:// ... /api/pokemon/sighting, including 'api/pokemon/sighting'.
    predictor.url = url;
    // the threshold for predictions. if the confidence of a prediction is bellow the threshold it will be ignored.
    predictor.threshold = 0.1;
    // if useCurrentDate is false this date will be used to retrieve data from the API
    predictor.requestDate = new Date('2016-09-14T08:00:00Z');
    // if true the current date will be used to retrieve data from the API
    predictor.useCurrentDate = false;
    // grid distance in km
    predictor.gridDistance = 0.25;

    const wekaCmd = 'java -classpath ./data/weka.jar -Xmx1024m'; // add more RAM by option: -Xmx1024m
    const classifier = 'weka.classifiers.meta.Vote';
    const classifierOptions = '-S 1 -B "weka.classifiers.lazy.IBk -K 100 -W 0 -A \\"weka.core.neighboursearch.LinearNNSearch -A \\\\\\"weka.core.EuclideanDistance -R first-last\\\\\\"\\"" -B "weka.classifiers.bayes.BayesNet -D -Q weka.classifiers.bayes.net.search.local.K2 -- -P 1 -S BAYES -E weka.classifiers.bayes.net.estimate.SimpleEstimator -- -A 0.5" -R PROD';
    // no-cv: no cross-validation, v: no training data statistics
    const trainingOptions = '-no-cv -v -classifications "weka.classifiers.evaluation.output.prediction.Null"';
    // p <range>: print predictions and attribute values in range. if range = 0 print no attributes
    // specify the output format of the predictions. Use CSV for easier parsing and PlainText for pretty print.
    const testOptions = '-classifications "weka.classifiers.evaluation.output.prediction.CSV"';
    const trainingData = __dirname + 'data/trainingData.arff';
    const testData = __dirname + 'data/testData.arff';

    var activeModelName = __dirname + 'data/classifier1.model';
    var trainingModelName = __dirname + 'data/classifier2.model';
    var coocTrainingData = null;
    var newCoocTrainingData = null;

    log('started prediction script, init DC');
    DC.consoleOn = false;
    DC.cooccClasses = [13, 16, 19, 96, 129];
    DC.init(__dirname + '/prediction_feature_config.json', true);

    var switchClassifierModel = false;
    retrainClassifier();
    var retrainTimer = setInterval(retrainClassifier, 1000 * 60 * 15); // retrain every 15min

    /**
     * create predictions for a 9x9 grid with the given coordinates in the center.
     * @param latitude
     * @param longitude
     * @param timestamp local time of the user in the format "2016-10-12T09:10:52.325Z"
     * @return {Array|{index: number, input: string}|*|Promise} promise which provides an array of predictions as result of the form: {"pokemonId":"16","confidence":"0.242","latitude":11.6088567,"longitude":48.1679286}
     */
    predictor.predict = function (latitude, longitude, timestamp) {
        return new Promise(
            function (resolve, reject) {
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

                var ts = new Date().getTime();
                var pokeEntries = createTestData(longitude, latitude, timestamp);
                test()
                    .then(function (result) {
                        var predictions = parsePredictionOutput(result.stdout);

                        for (var i = 0; i < predictions.length; i++) {
                            var prediction = predictions[i];
                            var pokeEntry = pokeEntries[i];
                            prediction.latitude = pokeEntry.latitude;
                            prediction.longitude = pokeEntry.longitude;
                        }
                        log('prediction took ' + (new Date().getTime() - ts));
                        resolve(predictions);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
        );
    };

    function getData(callback) {
        // 'ts/2016-09-14T08:00:00Z/range/1d';
        var urlForLast24h;

        if (predictor.useCurrentDate || predictor.requestDate === null) {
            urlForLast24h = predictor.url + '/ts/' + new Date().toJSON() + '/range/1d';
        }
        else {
            urlForLast24h = predictor.url + '/ts/' + predictor.requestDate.toJSON() + '/range/1d';
        }

        log('requesting ' + urlForLast24h);
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                var apiData = JSON.parse(xmlHttp.responseText);
                log('downloaded ' + apiData.data.length + ' sightings from API');
                var data = filter10kFromData(apiData.data);
                log('filtered data, new length ' + data.length);
                callback(data);
            }
        };
        xmlHttp.open("GET", urlForLast24h, true);
        xmlHttp.send();
        return xmlHttp.responseText;
    }

    function filter10kFromData(data) {
        while (data.length > 10000) {
            var index = Math.round(Math.random() * data.length);
            data.splice(index, 1);
        }

        return data;
    }

    function createTrainingSet() {
        return new Promise(
            function (resolve, reject) {
                getData(function (data) {
                    var cooc = DC.storeArffFile(data, trainingData, true, null);
                    resolve(cooc);
                });
            }
        );
    }

    function retrainClassifier(callback) {
        var cooc = null;
        var ts = new Date().getTime();
        log('created training arff file');
        createTrainingSet()
            .then(function (result) {
                log('train classifier model, arff file creation took ' + (new Date().getTime() - ts));
                cooc = result;
                var promise = trainModel();
                log('created classifier model, training took ' + (new Date().getTime() - ts));
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
        console.log(cmd);
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
                var confidence = parseFloat(components[4]);

                if (confidence >= predictor.threshold) {
                    predictions.push({
                        "pokemonId": components[2].split(':')[1],
                        "confidence": confidence
                    });
                }
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
        var locations = [];
        // from http://stackoverflow.com/a/7478827
        // new_latitude  = latitude  + (dy*gridDistance / 6371) * (180 / Math.PI);
        // new_longitude = longitude + (dx*gridDistance / 6371) * (180 / Math.PI) / Math.cos(latitude * Math.PI/180);
        const latitudeFactor = (predictor.gridDistance / 6371) * (180 / Math.PI);
        const longitudeFactor = latitudeFactor / Math.cos(latitude * Math.PI / 180);

        for (var dx = -4; dx <= 4; dx++) {
            for (var dy = -4; dy <= 4; dy++) {
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

    function log(message) {
        console.log(new Date().toJSON() + ' ' + message);
    }
})('undefined' !== typeof module ? module.exports : window);