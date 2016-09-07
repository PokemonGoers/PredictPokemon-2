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
        var splitKey = key.split('_');

        if (splitKey.length == 2 && splitKey[0] === "isPokemonId") {
            if (pokeEntry.pokemonId == splitKey[1]) {
                return 'isId' + splitKey[1];
            }
            else {
                return 'otherId';
            }
        }
        else {
            console.log("The key " + key + " is not handled by the Is Pokemon feature source.");
            throw "UnknownFeatureKey";
        }
    };
})('undefined' !== typeof module ? module.exports : window);