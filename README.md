

# PredictPokemon-2

[![Join the chat at https://gitter.im/pokemongoers/PredictPokemon-2](https://badges.gitter.im/pokemongoers/PredictPokemon-2.svg)](https://gitter.im/pokemongoers/PredictPokemon-2?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
In this project we will apply machine learning to establish the TLN (Time, Location and Name - that is where pokemons will appear, at what date and time, and which Pokemon will it be) prediction in Pokemon Go.

##Install
```
npm install predict-pokemon
```

## Setup
#### tzwhere bug
If you are running windows the script might get stuck in the `require('tzwhere')` call, due to an old version of *timezone* [tzwhere#13](https://github.com/mattbornski/tzwhere/issues/13).
To fix this modify the `package.json` of tzwhere, probably under the path `PredictPokemon\node_modules\tzwhere\package.json`.
- Set the timezone version under dependencies to `0.0.48`

```
  "dependencies": {
    ...
    "timezone": "0.0.48"
    ...
}
```

- delete the timezone folder in `PredictPokemon\node_modules\tzwhere\node_modules`
- change directory to `PredictPokemon\node_modules\tzwhere`
- run `npm install`

done :)

## Implementation
### Data Set
#### Feature sources
The data set which is used for the prediction consists out of different features, which need to be extracted from the [raw API data](http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/doc/#api-PokemonSighting-GetAllSightings) of Team A. To generate those features different feature sources are used. Each feature source provides different data, for example,
- one source extracts the S2 cell id's from the raw API data by using latitude and longitude
- whereas another extracts local time, hour of the day and other time-related features from the timestamp of the API data
- another source uses location and time to extract weather related features and so on...

##### getFeatures Method
To handle all feature sources in a generic way they have to provide the `getFeatures(keys, pokeEntry)` method. The method receives an array of unique keys which refer to features, e.g. the `hourOfTheDay` feature, and it receives a pokeEntry, which represents the JSON object that Team A uses to describe the sighting of a Pokemon. The pokeEntry provides the following data:

###### pokeEntry

```
{
  "_id": "57c92f926ffa1ace02c48f04",
  "source": "POKESNIPER",
  "appearedOn": "2016-09-02T07:53:21.000Z",
  "__v": 0,
  "pokemonId": 73,
  "latitude": -33.871224,
  "longitude": 151.199544,
  "appearedLocalTime": "2016-09-02T17:53:21.000Z"
}
```

The latitude and longitude are actually added additionally, to allow easy access. Team A sends them in a nested JSON object within the pokeEntry.
The same goes for appearedLocalTime.

###### Example feature source
Here is an example how a feature source has to be implemented in order to work with the rest:

```
// feature_sources/time_features.js
(function (exports) {
    var module = exports.module = {};

    module.getFeatures = function (keys, pokeEntry) {
    	var values = {};

    	keys.forEach(function (key) {
    		if (key === "hourOfTheDay") {
            	values[key] = parseHourOfTheDay(pokeEntry.appearedOn);
	        }
	        else {
	            console.log("The key " + key + " is not handled by the time feature source.");
	            throw "UnknownFeatureKey";
	        }
    	}        

    	return values;
    });
})('undefined' !== typeof module ? module.exports : window);
```

The source has to specify the `module` variable and implement `module.getFeatures = function (keys, pokeEntry)` so that it can be used by *dataSet_creator.js*. 
The source has to return an object as result, which maps a value to every key. The implementation of the function depends on the features to extract.

##### Feature config
The keys which are used in the `getFeatures` method have to be specified in the `feature_config.json` file, which looks like this:

```
{
  "classKey": "pokemonId",
  "feature_sources": [
      {
      "name": "API Features",
      "path": "./feature_sources/api_features.js",
      "enabled": true,
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
      "enabled": true,
      "features": [
        {
          "key": "hourOfTheDay",
          "type": "nominal",
          "enabled": true
        }
      ]
    }
  ]
}
```

###### Feature source
The config contains several feature sources, which can contain several features.
A feature source needs to specify:
- the relative `path` to the corresponding .js file
- an arbitrary `name`
- an `enabled` flag to indicate whether or not the features of the source should be included in the data set by specifying `true` or `false`.
- a list of `features`.

###### Feature
A feature is defined by:
- a unique `key`, which can only be used once in the whole config file
- a `type` which corresponds to the attribute type of Weka, e.g. numeric, string or nominal. If nominal is provided the script creates a nominal list with all distinct values that exist in the data set. For example: `@ATTRIBUTE source {POKESNIPER, POKERADAR, TWITTER}`
- an `enabled` flag to indicate individually whether or not the feature should be included in the data set, by specifying `true` or `false`. The source must be enabled for that.

###### Class key
The `classKey` defines which key will be used as classLabel when an .arff file is generated. The `classKey` has to correspond to a feature key in the configuration. If a feature key corresponds to the `classKey` it does not matter if the `enabled` flag is set or not. The script generates automatically a nominal list with all distinct values that exist in the data set for that key.


##Developers

Benjamin Strobel: benjamin.strobel@tum.de
Marcel Wagenländer: marcel.wagenlaender@tum.de
Matthias Bauer: 
Siamion Karcheuski: semioniy@mail.ru
Aurel Roci: aurel_2798@hotmail.com

##Licence 

Copyright (c) 2015 [Developers] (https://github.com/PokemonGoers/PredictPokemon-2/graphs/contributors)

Licensed under the MIT License