var S2 = require('s2-geometry').S2;

(function (exports) {
    var module = exports.module = {};

    /**
     * Get the feature value for the specified key by using the data of the pokeEntry,
     * which represents the JSON object which is returned from the API for a Pokemon sighting.
     * @param keys array of keys which refer to the name of features. The keys are read out from the feature_config.json
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     * @returns the values for the specified features by considering the given data.
     */
    module.getFeatures = function (keys, pokeEntry) {
        var values = {};

        keys.forEach(function (key) {
            if (key === "cellId_90m") {
                values[key] = cllId(pokeEntry.latitude, pokeEntry.longitude, 17);
            }
            else if (key === "cellId_180m") {
                values[key] = cllId(pokeEntry.latitude, pokeEntry.longitude, 16);
            }
            else if (key === "cellId_370m") {
                values[key] = cllId(pokeEntry.latitude, pokeEntry.longitude, 15);
            }
            else if (key === "cellId_730m") {
                values[key] = cllId(pokeEntry.latitude, pokeEntry.longitude, 14);
            }
            else if (key === "cellId_1460m") {
                values[key] = cllId(pokeEntry.latitude, pokeEntry.longitude, 13);
            }
            else if (key === "cellId_2920m") {
                values[key] = cllId(pokeEntry.latitude, pokeEntry.longitude, 12);
            }
            else if (key === "cellId_5850m") {
                values[key] = cllId(pokeEntry.latitude, pokeEntry.longitude, 11);
            }
            else {
                console.log("The key " + key + " is not handled by the S2 feature source.");
                throw "UnknownFeatureKey";
            }
        });

        return values;
    };

    // public method to print average cell distances for all S2 levels
    module.printAvCellDistances = function () {
        for (var i=0; i<=30; i += 1) {
            avgNieghbourDistnace(48.177118, 11.617856, i);
        }
    };

    //
    /**
     * private method to get the cell id for lat and lon at the specified level
     * @param latitude
     * @param longitude
     * @param level S2 level
     * @values[key] = cell id for the specified arguments
     */
    function cllId(latitude, longitude, level) {
        var key = S2.latLngToKey(latitude, longitude, level);
        return S2.keyToId(key);
    }

    function avgNieghbourDistnace(lat, lng, level) {
        var neighborKeys = S2.latLngToNeighborKeys(lat, lng, level);
        var latLongs = [];

        for(var i=0; i<4; i+=1) {
            latLongs[i] = S2.keyToLatLng(neighborKeys[i]);
        }

        var distance = latLonDistanceInKm(latLongs[0].lat, latLongs[0].lng, latLongs[1].lat, latLongs[1].lng);
        distance += latLonDistanceInKm(latLongs[1].lat, latLongs[1].lng, latLongs[2].lat, latLongs[2].lng);
        distance += latLonDistanceInKm(latLongs[2].lat, latLongs[2].lng, latLongs[3].lat, latLongs[3].lng);
        distance += latLonDistanceInKm(latLongs[3].lat, latLongs[3].lng, latLongs[0].lat, latLongs[0].lng);
        distance /= 4.0;

        console.log("level " + level +", avg distance: " + distance.toFixed(6) +"km\t" + (distance*1000).toFixed(3) +"m");
    }

    // from http://stackoverflow.com/a/27943
    function latLonDistanceInKm(lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1);
        var a =
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }
})('undefined' !== typeof module ? module.exports : window);