(function (exports) {
    var module = exports.module = {};

    var landcover = require('json/landcover.json');
    /**
     * Get the feature value for the specified key by using the data of the pokeEntry,
     * which represents the JSON object which is returned from the API for a Pokemon sighting.
     * @param key the name of the feature. The key is read out from the feature_config.json
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     * @returns the value for the specified feature by considering the given data.
     */
    module.getFeature = function (key, pokeEntry) {
        if (key === "terrainType") {
            return getTerrain(pokeEntry.latitude, pokeEntry.longitude);
        }
        else if(key == 'getSurroundingTerrain500m'){

        }
        else {
            console.log("The key " + key + " is not in the raw API data.");
            throw "UnknownFeatureKey";
        }
    };

    /*
     * returns a classification of the environment at the given coordinates
     * for meaning of return values see http://glcf.umd.edu/data/lc/
     */
    module.getTerrain = function (lat, lon) {
        var landcover = require('json/landcover.json');
        var cellsize = 0.0833333333333;
        if (lat > -64.0 && lat <= 84.0 && lng >= -180.0 && lng < 180.0) {
            var y = Math.floor((84.0 - lat) / cellsize);
            var x = Math.floor((lng + 180.0) / cellsize);
            return landcover[y][x];
        } else
            return 255;
    };


    module.getSurroundingTerrain = function (lat, lon) {
        var cellsize = 0.0833333333333;
        if (lat > -64.0 && lat <= 84.0 && lng >= -180.0 && lng < 180.0) {
            var y = Math.floor((84.0 - lat) / cellsize);
            var x = Math.floor((lng + 180.0) / cellsize);
            return landcover[y][x];
        } else
            return 255;
    };

})('undefined' !== typeof module ? module.exports : window);