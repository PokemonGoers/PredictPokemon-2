var predictor = require('./prediction.js').predictor;
var testTimer = setInterval(testClassifier, 1000);//60 * 15);


var a = [-38.417266, -10.868907,
    39.261307, 8.821044,
    31.977890, 4.730040,
    -5.125976, 1.810550,
    -21.551901, 10.017019,
    -27.533635, 7.038159,
    1.238726, -3.704821,
    21.862966, 1.082948,
    -36.563780, 10.192890,
    -1.603914, -8.259107,
    28.842410, -4.619748,
    39.528843, 9.885698,
    -12.640936, 4.270587,
    7.495218, -7.524487,
    24.301100, 0.303072,
    46.033249, -3.455931,
    -30.383543, -9.666009,
    14.355324, 10.534102,
    25.952010, -8.585069,
    -6.692198, -7.957315,
    -18.030644, 1.454737,
    2.151600, 2.839492,
    14.109366, -10.734288,
    -35.584098, 10.070699,
    -34.282433, -5.623847,
    24.224851, -1.038287,
    26.338474, 1.641568,
    -8.242076, -10.936883,
    -9.215696, 7.679962,
    43.390949, -0.180173,
    8.511033, 7.919094,
    39.960860, 11.530374,
    -10.308718, -4.855671,
    11.081647, 3.001226,
    -3.779224, -0.568245,
    -19.570179, -9.260897,
    0.850780, 0.481314,
    12.718437, 8.718371,
    -11.115739, -3.901392,
    47.562053, -3.514944,
    37.000439, 1.628020,
    36.742440, -4.284545,
    33.478548, -5.068678,
    -28.587902, -2.058336,
    42.281652, 8.411809,
    14.455300, 4.603727,
    -43.384523, 5.417508,
    -22.053207, 2.106640,
    -22.094842, 1.864868,
    -25.836654, 4.992287];
var i = 0;
predictor.threshold = 0.0;
predictor.gridDistance = 2.0;
predictor.mockData = true;
predictor.init();

function testClassifier() {
    predictor.predict(a[i], a[i+1], new Date().toJSON())
        .then(function (result) {
            if (i % 4 === 0) {
                predictor.gridDistance += 1;
            }

            var sum = 0;
            result.forEach(function (p) {
                sum += p.confidence;
            });
            var mean = sum / result.length;
            var vari = 0;
            result.forEach(function (p) {
                var s = (p.confidence - mean);
                vari += s*s;
            });
            vari = vari / result.length;
            vari = vari < 0.0001 ? 0.0 : vari;

            i += 2;
            if (i > a.length - 2) {
                i = 0;
            }
            log('#pred: ' + result.length + ', thrsh: ' + predictor.threshold
                + ' - conf#1 ' + result[0].confidence + ' - mean ' + mean
                + ' - var ' + vari + ' - dis ' + predictor.gridDistance);
            // log(new Date().toJSON() + ' predicted ' + result.length + ' entries, first:'
            //     +JSON.stringify(result[0]));
        })
        .catch(function (err) {
            console.log('Error: ' + err);
        });
    // predict(48.17711 + Math.random(), 11.61785 + Math.random(), 0);
}

function log(message) {
    console.log(new Date().toJSON() + ' ' + message);
}


function processInput() {
    var lat = document.getElementById("lat").value;
    var lon = document.getElementById("lon").value;

    var predictions = predictor.predict(lat, lon, new Date().toJSON())

    document.getElementById("demo").innerHTML = JSON.stringify(predictions);
}
