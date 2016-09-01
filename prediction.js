var fs = require('fs');
var svm = require('node-svm');

var data = fs.readFileSync('dummy1.json', 'utf8');
var data2 = fs.readFileSync('dummy2.json', 'utf8');
var data3 = fs.readFileSync('dummy3.json', 'utf8');
var data4 = fs.readFileSync('dummy4.json', 'utf8');

var json_data = JSON.parse(data);

var location_pokemon = [];

json_data.forEach(function (element) {
    location_pokemon.push([[element.latitude, element.longitude], element.pokemonId]);
});

console.log(location_pokemon);

var classifier = new svm.CSVC({
    kFold:10
});

classifier.train(location_pokemon).done(function () {
    location_pokemon.forEach(function (element) {
        var prediction = classifier.predictSync(element[0]);
        console.log('%d - %d -- %d', element[0][0], element[0][1], prediction);
    });
});
