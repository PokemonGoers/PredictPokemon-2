/**
 * Created on 07.10.2016.
 */
(function (exports) {
    var path = require('path');
    var exec = require('child-process-promise').exec;
    var DC = require(path.join(__dirname, '/dataSet_creator.js')).DC;
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    // var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting';
    var url = 'http://predictemall.online:65014/api/pokemon/sighting';

    var predictor = exports.predictor = {};
    // the base url to the pokeData API for sightings: http:// ... /api/pokemon/sighting, including 'api/pokemon/sighting'.
    predictor.url = url;
    // the threshold for predictions. if the confidence of a prediction is bellow the threshold it will be ignored.
    predictor.threshold = 0.5;
    // if useCurrentDate is false this date will be used to retrieve data from the API
    predictor.requestDate = new Date('2016-09-14T08:00:00Z');
    // if true the current date will be used to retrieve data from the API
    predictor.useCurrentDate = false;
    // grid distance in km
    predictor.gridDistance = 0.25;
    // use mock data to test predictions
    predictor.mockData = false;

    const wekaCmd = 'java -classpath ' + path.join(__dirname, 'data/weka.jar') + ' -Xmx1024m'; // add more RAM by option: -Xmx1024m
    const classifier = 'weka.classifiers.meta.Vote';
    const classifierOptions = '-S 1 -B "weka.classifiers.lazy.IBk -K 100 -W 0 -A \\"weka.core.neighboursearch.LinearNNSearch -A \\\\\\"weka.core.EuclideanDistance -R first-last\\\\\\"\\"" -B "weka.classifiers.bayes.BayesNet -D -Q weka.classifiers.bayes.net.search.local.K2 -- -P 1 -S BAYES -E weka.classifiers.bayes.net.estimate.SimpleEstimator -- -A 0.5" -R PROD';
    // no-cv: no cross-validation, v: no training data statistics
    const trainingOptions = '-no-cv -v -classifications "weka.classifiers.evaluation.output.prediction.Null"';
    // p <range>: print predictions and attribute values in range. if range = 0 print no attributes
    // specify the output format of the predictions. Use CSV for easier parsing and PlainText for pretty print.
    const testOptions = '-classifications "weka.classifiers.evaluation.output.prediction.CSV"';
    const trainingData = path.join(__dirname, 'data/trainingData.arff');
    const testData = path.join(__dirname, 'data/testData.arff');

    var activeModelName = path.join(__dirname, 'data/classifier1.model');
    var trainingModelName = path.join(__dirname, 'data/classifier2.model');
    var coocTrainingData = null;
    var newCoocTrainingData = null;

    log('started prediction script, init DC');
    DC.consoleOn = false;
    DC.cooccClasses = [13, 16, 19, 96, 129];
    DC.init(path.join(__dirname, '/prediction_feature_config.json'), true);

    var switchClassifierModel = false;
    var retrainTimer = null;
    
    predictor.init = function () {
        retrainClassifier();
        retrainTimer = setInterval(retrainClassifier, 1000 * 60 * 15); // retrain every 15min
    };

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
                        if (result.stderr !== ""  && result.stdout === "") {
                            reject(result.stderr);
                        }
                        else {
                            var predictions = parsePredictionOutput(result.stdout);
    
                            for (var i = 0; i < predictions.length; i++) {
                                var prediction = predictions[i];
                                var pokeEntry = pokeEntries[i];
                                prediction.latitude = pokeEntry.latitude;
                                prediction.longitude = pokeEntry.longitude;
                            }
                            //log('prediction took ' + (new Date().getTime() - ts));
                            resolve(predictions);
                        }
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
        );
    };

    function useMockData(callback) {
        callback([
            {"_id":"57c92f926ffa1ace02c48f04","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:21.000Z","__v":0,"pokemonId":73,"location":{"coordinates":[151.199544,-33.871224],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f01","source":"POKESNIPER","appearedOn":"2016-09-02T07:52:57.000Z","__v":0,"pokemonId":122,"location":{"coordinates":[22.411684,40.791931],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f03","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:14.000Z","__v":0,"pokemonId":97,"location":{"coordinates":[14.030339,50.684582],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f05","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:24.000Z","__v":0,"pokemonId":143,"location":{"coordinates":[151.207102,-33.859318],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f06","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:38.000Z","__v":0,"pokemonId":117,"location":{"coordinates":[-74.007198,40.718725],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f07","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:47.000Z","__v":0,"pokemonId":18,"location":{"coordinates":[-119.029218,35.426861],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f08","source":"POKESNIPER","appearedOn":"2016-09-02T07:54:09.000Z","__v":0,"pokemonId":138,"location":{"coordinates":[-99.199814,19.411314],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f09","source":"POKESNIPER","appearedOn":"2016-09-02T07:54:16.000Z","__v":0,"pokemonId":33,"location":{"coordinates":[-83.92087,9.857945],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f02","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:04.000Z","__v":0,"pokemonId":99,"location":{"coordinates":[-122.441549,37.775157],"type":"Point"}},
            {"_id":"57c92f926ffa1ace02c48f0c","source":"POKESNIPER","appearedOn":"2016-09-02T07:54:34.000Z","__v":0,"pokemonId":30,"location":{"coordinates":[-73.98507,40.761295],"type":"Point"}}
        ]);
    }

    function getData(callback) {
        if (predictor.mockData === true) {
            log('getting mock data..');
            useMockData(callback);
            return;
        }
        
        // 'ts/2016-09-14T08:00:00Z/range/1d';
        var urlForLast24h;
        var timestamp;

        if (predictor.useCurrentDate || predictor.requestDate === null) {
            timestamp = new Date().toJSON();
        }
        else {
            timestamp = predictor.requestDate.toJSON();
        }

        urlForLast24h = predictor.url + '/ts/' + timestamp + '/range/1d?token=I0TPIIpCLH8lR8iDrCMV';

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
            else {
                log('download failed. ' + JSON.stringify(xmlHttp));
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
        const cosFactor = Math.cos(latitude * Math.PI / 180);
        var longitudeFactor = 0;
        
        if (cosFactor !== 0) {
            longitudeFactor = latitudeFactor / cosFactor;
        }
        
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
