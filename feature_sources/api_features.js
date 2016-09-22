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
            if (key === "_id") {
                values[key] = pokeEntry[key].replace(/\s+/g, '');
            }
            else if (key === "source") {
                values[key] = pokeEntry[key].replace(/\s+/g, '');
            }
            else if (hasOwnProperty.call(pokeEntry, key)) {
                values[key] = pokeEntry[key];

            }
            else {
                console.log("The key " + key + " is not in the raw API data.");
                throw "UnknownFeatureKey";
            }
        });

        return values;
    };
})('undefined' !== typeof module ? module.exports : window);