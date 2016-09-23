(function (exports) {
    var module = exports.module = {};
    var density = parseCSV('data/population_density.csv');

    module.getFeatures = function (keys, pokeEntry) {
        var values = {};

        keys.forEach(function (key) {
            if (key === "population_density") {
                values[key] = getPopulationDensity(density, pokeEntry.latitude, pokeEntry.longitude);
            }
            else if (key === "rural") {
                values[key] = isRural(getPopulationDensity(density, pokeEntry.latitude, pokeEntry.longitude));
            }
            else if (key === "midurban") {
                values[key] = isMidurban(getPopulationDensity(density, pokeEntry.latitude, pokeEntry.longitude));
            }
            else if (key === "suburban") {
                values[key] = isSuburban(getPopulationDensity(density, pokeEntry.latitude, pokeEntry.longitude));
            }
            else if (key === "urban") {
                values[key] = isUrban(getPopulationDensity(density, pokeEntry.latitude, pokeEntry.longitude));
            }
            else {
                console.log("The key " + key + " is not handled by the population density feature source.");
                throw "UnknownFeatureKey";
            }
        });

        return values;
    };
    
    function isRural(number) {
        if (number < 200) {
            return true;
        }
        return false;
    }

    function isMidurban(number) {
        if (number >= 200) {
            return true;
        }
        return false;
    }

    function isSuburban(number) {
        if (number >= 400) {
            return true;
        }
        return false;
    }

    function isUrban(number) {
        if (number >= 800) {
            return true;
        }
        return false;
    }

    function getPopulationDensity (density, lat, long) {
        // map lat long to entry point
        var pixel_lat = 900 - (lat * 10);
        var pixel_long = 1800 + (long * 10);

        //cut decimal places
        pixel_lat = parseInt(pixel_lat);
        pixel_long = parseInt(pixel_long);

        // unit is persons/km^2
        return density[pixel_lat][pixel_long];
    }

    //parses a csv file into a 2D array of floats
    function parseCSV (path) {
        const fs = require('fs');

        const data = fs.readFileSync(path, 'utf8');

        var array = data.split('\n');
        for (var i = 0; i < array.length; i++) {
            array[i] = array[i].split(',');
        }

        for (var i = 0; i < array.length; i++) {
            for (var j = 0; j < array[i].length; j++) {
                array[i][j] = parseFloat(array[i][j]);
                if (array[i][j] === 99999) {
                    array[i][j] = 0;
                }
            }
        }
        return array;
    }
})('undefined' !== typeof module ? module.exports : window);
