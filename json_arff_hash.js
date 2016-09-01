var fs = require('fs');
var crypto = require('crypto');
var hash = crypto.createHash('sha256');

var source = 'json/dummy1.json';
var destination = 'arff/dummy1_numeric.arff';
jsonToArff(source, destination);

function jsonToArff(source, destination) {
    var data = fs.readFileSync(source, 'utf8');
    var json_data = JSON.parse(data);

    var splitedFileName = source.split('/');
    splitedFileName = splitedFileName[splitedFileName.length-1];
    splitedFileName = splitedFileName.split('.');
    var fileName = splitedFileName[0];

    var arff = '';
    arff = arff + '@RELATION ' + fileName + '\n' + '\n';

    var firstElement = json_data[0];
    for (var key in firstElement) {
        //if (Object.hasOwnProperty(key)) {
            arff = arff + '@ATTRIBUTE ' + key + ' numeric\n';
        //}
    }
    arff = arff + '@ATTRIBUTE class {+1,-1}\n\n'

    arff = arff + '@DATA\n';
    for (var i = 0; i < json_data.length; i++) {
        var element = json_data[i];
        for (var key in element) {
            //if (Object.hasOwnProperty(key)) {
                if (typeof element[key] === 'string') {
                    hash = crypto.createHash('sha256');
                    hash.update(element[key]);
                    arff = arff + parseInt('0x' + hash.digest('hex'), 'hex') + ',';
                } else {
                    arff = arff + element[key] + ',';
                }
            //}
        }
        arff = arff + randomPlusMinus() + '\n';
    }

    fs.writeFileSync(destination, arff, 'utf8');
}

function randomPlusMinus() {
    var number = Math.random();
    if (number <= 0.5) {
        return '-1';
    } else {
        return '+1';
    }
}
