/**
 * Created by Benjamin on 07.10.2016.
 */
var exec = require('child-process-promise').exec;
var S2 = require('s2-geometry').S2;

predict(0, 0, 0);

function predict(lat, lon, timestamp) {
    var wekaCmd = 'java -classpath ./data/weka.jar'; // add more RAM by option: -Xmx1024m
    var classifier = 'weka.classifiers.bayes.NaiveBayes';
    // no-cv: no cross-validation, v: no training data statistics
    var trainingOptions = '-no-cv -v';
    // p <range>: print predictions and attribute values in range. if range = 0 print no attributes
    // specify the output format of the predictions. Use CSV for easier parsing and PlainText for pretty print.
    var testOptions = '-classifications "weka.classifiers.evaluation.output.prediction.CSV"';
    var modelName = 'data/classifier.model';
    var trainingData = 'data/trainingData.arff';
    var testData = 'data/testData.arff';

    /**
     * train model
     * java -classpath ./data/weka.jar -Xmx1024m weka.classifiers.bayes.NaiveBayes -t weather.arff -d weather-NB.model
     * @return {Array|{index: number, input: string}|*|Promise}
     */
    function trainModel() {
        var cmd = wekaCmd + ' ' + classifier + ' ' + trainingOptions
            + ' -t ' + trainingData     // training data to be used to create the model
            + ' -d ' + modelName;       // store the trained model with the specified name
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
        return exec(cmd);
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
    function createGridLocation(latitude, longitude) {
        const gridDistance = 0.25;  // 250m grid distance -> 2km for 9 grids from the center
        var locations = [];

        for(var dx = -4; i <= 4; i++) {
            for(var dy = -4; i <= 4; i++) {
                // from http://stackoverflow.com/a/7478827
                var new_latitude  = latitude  + (dy*gridDistance / 6371) * (180 / Math.PI);
                var new_longitude = longitude + (dx*gridDistance / 6371) * (180 / Math.PI) / cos(latitude * Math.PI/180);
                locations.push({
                    "latitude": new_latitude,
                    "longitude": new_longitude
                });
            }
        }

        return locations;
    }

    function latLon(key) {
        var latLon = S2.keyToLatLng(key);
        return latLon.lat + ', ' + latLon.lng;
    }

    /**
     * create an array of location coordinates around the query location which correspond to the center of cell id's
     * according to the specifed S2 cell level
     * @param latitude
     * @param longitude
     */
    function createCellLocations(latitude, longitude, level) {
        var key = S2.latLngToKey(latitude, longitude, level);
        var n = S2.fromKey(key);
        var neighbours = S2.S2Cell.FromLatLng({lat: latitude, lng: longitude}, level).getNeighbors();

        neighbours.forEach(function (neighbour) {
            var cellKeys = neighbour.getNeighbors().map(function (cell) {
                return cell.toHilbertQuadkey();
            });
            console.log('neighbour: ' + neighbour.toHilbertQuadkey() + ', ' + latLon(neighbour.toHilbertQuadkey()));
            cellKeys.forEach(function (key) {
                console.log(key + ', ' + latLon(key));
            });
        });
    }

    function avgNieghbourDistnace(lat, lng, level) {
        var neighborKeys = S2.latLngToNeighborKeys(lat, lng, level);
        var latLongs = [];



        for(var i=0; i<4; i+=1) {
            latLongs[i] = S2.keyToLatLng(neighborKeys[i]);
        }

        var distance = latLonDistanceInKm(latLongs[0].lat, latLongs[0].lng, latLongs[1].lat, latLongs[1].lng);
        distance += latLonDistanceInKm(latLongs[1].lat, latLongs[1].lng, latLongs[2].lat, latLongs[2].lng);
        distance += latLonDistanceInKm(latLongs[2].lat, latLongs[2].lng, latLongs[3].lat, latLongs[3].lng);
        distance += latLonDistanceInKm(latLongs[3].lat, latLongs[3].lng, latLongs[0].lat, latLongs[0].lng);
        distance /= 4.0;

        console.log("level " + level +", avg distance: " + distance.toFixed(6) +"km\t" + (distance*1000).toFixed(3) +"m");
    }

    createCellLocations(48.17711, 11.61785, 20);

    trainModel()
        .then(function (result) {
            console.log('-- training completed');
            // console.log('-- train stderr: ' + result.stderr);
            // console.log('-- train stdout: ' + result.stdout);
            return test();
        })
        .then(function (result) {
            console.log('-- test completed');
            // console.log('-- test stderr: ' + result.stderr);
            console.log('-- test stdout: ' + result.stdout);
            var predictions = parsePredictionOutput(result.stdout);
            predictions.forEach(function (prediction) {
                console.log('class: ' + prediction.classLabel + ', confidence: ' +prediction.confidence);
            })
        })
        .catch(function (err) {
            console.error('ERROR: ', err);
        });

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