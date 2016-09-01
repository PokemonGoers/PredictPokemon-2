var svm = require('node-svm');

var xor = [
    [[0, 0], 0],
    [[0, 1], 1],
    [[1, 0], 1],
    [[1, 1], 0]
];

// initialize a new predictor
var clf = new svm.CSVC();

clf.train(xor).done(function () {
    // predict things
    xor.forEach(function (ex) {
        var prediction = clf.predictSync(ex[0]);
        console.log('%d XOR %d => %d', ex[0][0], ex[0][1], prediction);
    });
});
