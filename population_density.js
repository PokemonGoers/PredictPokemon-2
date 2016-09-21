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
