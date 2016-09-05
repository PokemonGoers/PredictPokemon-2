(function (exports) {
    var module = exports.module = {};

    /**
     * Get the feature value for the specified key by using the data of the pokeEntry,
     * which represents the JSON object which is returned from the API for a Pokemon sighting.
     * @param key the name of the feature. The key is read out from the feature_config.json
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     * @returns the value for the specified feature by considering the given data.
     */
    module.getFeature = function (key, pokeEntry) {
        if (key === "_id") {
            return pokeEntry[key].replace(/\s+/g, '');
        }
        else if (key === "source") {
            return pokeEntry[key].replace(/\s+/g, '');
        }
        else if (hasOwnProperty.call(pokeEntry, key)) {
            return pokeEntry[key];
        }
        else {
            console.log("The key " + key + " is not in the raw API data.");
            throw "UnknownFeatureKey";
        }
    };
})('undefined' !== typeof module ? module.exports : window);