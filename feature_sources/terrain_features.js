(function (exports) {
    var module = exports.module = {};

    var landcover = fileToJson('json/landcover.json');
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
        else if (key == 'closeToWater') {
            return closeToWater(pokeEntry.latitude, pokeEntry.longitude);
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
        if (lat > -64.0 && lat <= 84.0 && lon >= -180.0 && lon < 180.0) {
            var y = Math.floor((84.0 - lat) / cellsize);
            var x = Math.floor((lon + 180.0) / cellsize);
            return landcover[y][x];
        } else {
            return 255;
        }
    };


    /*
     *check the surrounding are from the current location by one cell as
     * described at http://glcf.umd.edu/data/lc/
     */
    module.closeToWater = function (lat, lon) {
        var cellsize = 0.0833333333333;
        if (lat > -64.0 && lat <= 84.0 && lon >= -180.0 && lon < 180.0) {
            var y = Math.floor((84.0 - lat) / cellsize);
            var x = Math.floor((lon + 180.0) / cellsize);

            if (landcover[y][x] == 0) {
                return true;
            } else if (landcover[y][x + 1] == 0) {
                return true;

            } else if (landcover[y + 1][x + 1] == 0) {
                return true;
            }
            else if (landcover[y + 1][x] == 0) {
                return true;
            }
            else if (landcover[y + 1][x - 1] == 0) {
                return true;
            }
            else if (landcover[y][x - 1] == 0) {
                return true;
            }
            else if (landcover[y - 1][x - 1] == 0) {
                return true;
            }
            else if (landcover[y - 1][x] == 0) {
                return true;
            }
            else if (landcover[y - 1][x + 1] == 0) {
                return true;
            } else {
                return false;
            }

        } else {
            return false;
        }
    };


    function fileToJson(file) {
        var data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    }

})('undefined' !== typeof module ? module.exports : window);