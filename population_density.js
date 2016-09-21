function parseCSV(path) {
    const fs = require('fs');

    const data = fs.readFileSync(path, 'utf8');

    var array = data.split('\n');
    for (var i = 0; i < array.length; i++) {
        array[i] = array[i].split(',');
    }

    for (var i = 0; i < array.length; i++) {
        for (var j = 0; j < array[i].length; j++) {
            array[i][j] = parseInt(array[i][j]);
        }
    }
    return array;
}

function getPopulation(density, lat, long) {
    var pixel_lat = 900 - (lat * 10);
    var pixel_long = 1800 + (long * 10);
    pixel_lat = parseInt(pixel_lat);
    pixel_long = parseInt(pixel_long);

    return density[pixel_lat][pixel_long]; // persons/km^2
}


function test() {
    var path = 'population_density.csv';
    var density = parseCSV(path);
    console.log(getPopulation(density, 48.137252, 11.574827)); // Munich
    console.log(getPopulation(density, 49.112507, 9.737344)); // Schwäbisch Hall
    console.log(getPopulation(density, 43.271147, 6.637755)); // Saint-Tropez
    console.log(getPopulation(density, 35.685924, 139.757869)); // Tokyo
    console.log(getPopulation(density, -22.912849, -43.228824)); // Rio de Janeiro
}
test();
