var predictor = require('./prediction.js').predictor;
var testTimer = setInterval(testClassifier, 1000);//60 * 15);

function testClassifier() {
    predictor.predict(48.17711, 11.61785, new Date().toJSON())
        .then(function (result) {
            console.log(new Date().toJSON() + ' predicted ' + result.length + ' entries, first:'
                +JSON.stringify(result[0]));
        })
        .catch(function (err) {
            console.log('Error: ' + err);
        });
    // predict(48.17711 + Math.random(), 11.61785 + Math.random(), 0);
}


function processInput() {
    var lat = document.getElementById("lat").value;
    var lon = document.getElementById("lon").value;

    var predictions = predictor.predict(lat, lon, new Date().toJSON())

    document.getElementById("demo").innerHTML = JSON.stringify(predictions);
}