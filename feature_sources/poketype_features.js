var fs = require('fs');

(function (exports) {
    var module = exports.module = {};
    var pokeTypes = fileToJson('json/pokemon_types.json');

    /**
     * Get the feature value for the specified key by using the data of the pokeEntry,
     * which represents the JSON object which is returned from the API for a Pokemon sighting.
     * @param key the name of the feature. The key is read out from the feature_config.json
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     * @returns the value for the specified feature by considering the given data.
     */
    module.getFeature = function (key, pokeEntry) {
        if(key === 'typeSteel') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Steel') >= 0;
        }
        else if(key === 'typeGhost') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Ghost') >= 0;
        }
        else if(key === 'typeElectric') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Electric') >= 0;
        }
        else if(key === 'typeIce') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Ice') >= 0;
        }
        else if(key === 'typeNormal') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Normal') >= 0;
        }
        else if(key === 'typeFire') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Fire') >= 0;
        }
        else if(key === 'typePsychic') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Psychic') >= 0;
        }
        else if(key === 'typeFlying') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Flying') >= 0;
        }
        else if(key === 'typePoison') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Poison') >= 0;
        }
        else if(key === 'typeDragon') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Dragon') >= 0;
        }
        else if(key === 'typeWater') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Water') >= 0;
        }
        else if(key === 'typeFighting') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Fighting') >= 0;
        }
        else if(key === 'typeRock') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Rock') >= 0;
        }
        else if(key === 'typeFairy') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Fairy') >= 0;
        }
        else if(key === 'typeGrass') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Grass') >= 0;
        }
        else if(key === 'typeBug') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Bug') >= 0;
        }
        else if(key === 'typeGround') {
            return pokeTypes[pokeEntry.pokemonId].indexOf('Ground') >= 0;
        }
        else {
            console.log("The key " + key + " is not handled by the type feature source.");
            throw "UnknownFeatureKey";
        }
    };

    function fileToJson(file) {
        var data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    }
})('undefined' !== typeof module ? module.exports : window);