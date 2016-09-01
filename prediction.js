var fs = require('fs');
var svm = require('node-svm');

var data = fs.readFileSync('json/dummy1.json', 'utf8');
var data2 = fs.readFileSync('json/dummy2.json', 'utf8');
var data3 = fs.readFileSync('json/dummy3.json', 'utf8');
var data4 = fs.readFileSync('json/dummy4.json', 'utf8');

var json_data = JSON.parse(data);
var json_data2 = JSON.parse(data2);
var json_data3 = JSON.parse(data3);
var json_data4 = JSON.parse(data4);

json_data = json_data.concat(json_data2);
json_data = json_data.concat(json_data3);
json_data = json_data.concat(json_data4);

var location_pokemon = [];

json_data.forEach(function (element) {
    location_pokemon.push([[element.latitude, element.longitude], element.pokemonId]);
});

console.log(location_pokemon);

var classifier = new svm.CSVC({
    kFold:10
});

classifier.train(location_pokemon)
    .progress(function(progress){
        console.log('training progress: %d%', Math.round(progress*100));
    })

    .done(function () {
        location_pokemon.forEach(function (element) {
            var prediction = classifier.predictSync(element[0]);
            console.log('%d - %d -- %d', element[0][0], element[0][1], prediction);
        });
    });
