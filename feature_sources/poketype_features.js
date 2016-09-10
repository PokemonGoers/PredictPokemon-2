var fs = require('fs');

(function (exports) {
    var module = exports.module = {};
    var pokeTypes = fileToJson('json/pokemon_types.json');

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
            if(key === 'typeSteel') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Steel') >= 0;
            }
            else if(key === 'typeGhost') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Ghost') >= 0;
            }
            else if(key === 'typeElectric') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Electric') >= 0;
            }
            else if(key === 'typeIce') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Ice') >= 0;
            }
            else if(key === 'typeNormal') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Normal') >= 0;
            }
            else if(key === 'typeFire') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Fire') >= 0;
            }
            else if(key === 'typePsychic') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Psychic') >= 0;
            }
            else if(key === 'typeFlying') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Flying') >= 0;
            }
            else if(key === 'typePoison') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Poison') >= 0;
            }
            else if(key === 'typeDragon') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Dragon') >= 0;
            }
            else if(key === 'typeWater') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Water') >= 0;
            }
            else if(key === 'typeFighting') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Fighting') >= 0;
            }
            else if(key === 'typeRock') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Rock') >= 0;
            }
            else if(key === 'typeFairy') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Fairy') >= 0;
            }
            else if(key === 'typeGrass') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Grass') >= 0;
            }
            else if(key === 'typeBug') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Bug') >= 0;
            }
            else if(key === 'typeGround') {
                values[key] = pokeTypes[pokeEntry.pokemonId].indexOf('Ground') >= 0;
            }
            else {
                console.log("The key " + key + " is not handled by the type feature source.");
                throw "UnknownFeatureKey";
            }
        });
        
        return values;
    };

    function fileToJson(file) {
        var data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    }
})('undefined' !== typeof module ? module.exports : window);