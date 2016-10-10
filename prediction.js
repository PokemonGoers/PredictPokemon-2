/**
 * Created by Benjamin on 07.10.2016.
 */
var exec = require('child-process-promise').exec;

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