# PredictPokemon-2

[![Join the chat at https://gitter.im/pokemongoers/PredictPokemon-2](https://badges.gitter.im/pokemongoers/PredictPokemon-2.svg)](https://gitter.im/pokemongoers/PredictPokemon-2?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
In this project we will apply machine learning to establish the TLN (Time, Location and Name - that is where pokemons will appear, at what date and time, and which Pokemon will it be) prediction in Pokemon Go.


## Implementation
### Data Set
#### Feature sources
The data set which is used for the prediction consists out of different features, which need to be extracted from the [raw API data](http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/doc/#api-PokemonSighting-GetAllSightings) of Team A.

Each feature sources provides different data, for example,
- one source extracts the S2 cell id's from the raw API data by using it's latitude and longitude
- whereas another extracts local time, hour of the day and other time related features from the timestamp of the API data
- another source uses location and time to extract weather realted features and so on...

##### getFeature Method
To handle all feature sources in a generic way they have to provide the `getFeature(key, pokeEntry)` mehtod. The method receives a unique key which refers to feature, e.g. the `hourOfTheDay` feature, and it recevies a pokeEntry, which represents the JSON object that Team A uses to describe the sighting of a Pokemon. The pokeEntry provides the following data:
###### pokeEntry
```
{
  "_id": "57c92f926ffa1ace02c48f04",
  "source": "POKESNIPER",
  "appearedOn": "2016-09-02T07:53:21.000Z",
  "__v": 0,
  "pokemonId": 73,
  "latitude": 151.199544,
  "longitude": -33.871224
}
```
The latitude and longitude are actually added additonally, to allow easy access. Team A sends them in a nested JSON object within the pokeEntry.
###### Example feature source
Here is an exaple how a feature source has to be implemented in order to work with the rest:
```
// feature_sources/time_features.js
(function (exports) {
    var module = exports.module = {};

    module.getFeature = function (key, pokeEntry) {
        if (key === "hourOfTheDay") {
            return parseHourOfTheDay(pokeEntry.appearedOn);
        }
        else {
            console.log("The key " + key + " is not handled by the time feature source.");
            throw "UnknownFeatureKey";
        }
    };
})('undefined' !== typeof module ? module.exports : window);
```
The source has to specify the `module` variable and implement `module.getFeature = function (key, pokeEntry)` so that it can be used by *dataSet_creator.js*. The implementation of the function depends on the feature to extract.
##### Feature config
The keys which are used in the `getFeature` method have to be specified in the `feature_config.json` file, which looks like this:
```
{
  "classKey": "pokemonId",
  "feature_sources": [
      {
      "name": "API Features",
      "path": "./feature_sources/api_features.js",
      "features": [
        {
          "key": "pokemonId",
          "type": "numeric",
          "enabled": true
        }
      ]
    },
    {
      "name": "Time Features",
      "path": "./feature_sources/time_features.js",
      "features": [
        {
          "key": "hourOfTheDay",
          "type": "numeric",
          "enabled": true
        }
      ]
    }
  ]
}
```
###### Feature source
The config contains several feature sources, which can contains everal features.
A feature source needs to specify:
- the relative `path` to the corresponding .js file
- an arbitrary `name`
- a list of `features`.
###### Feature
A feature is defined by:
- a unique `key`, which can only be used once in the whole config file
- a `type` which corresponds to the attribute type of weka, e.g. numeric, string or nominal. If nominal is provided the script creates a nominal list with all distinct values that exist in the data set. For example: `@ATTRIBUTE source {POKESNIPER, POKERADAR, TWITTER}`
- an `enabled` flag to indicate wheter or not the feature should be included in the data set, by specifing `true` or `false`.

###### Class key
The `classKey` defines which key will be used as classLabel when an .arff file is generated. The `classKey` has to correspond to a feature key in the configuration. If a feature key corresponds to the `classKey` it does not matter if the `enabled` flug is set or not. The script generats automatically a nominal list with all distinct values that exist in the data set for that key.