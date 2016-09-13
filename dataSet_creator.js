var fs = require('fs');
var tzwhere = require('tzwhere');
WeatherApiKey = 0;// Identifies which API Key is used right now. Has to be here to be global
CachedWeatherResponses = {"empty":"json file"};//for API Request results storage

(function (exports) {
    var DC = exports.DC = {};
    var dataSet = null;
    var featureSources = null;
    var postProcessSources = null;
    var classSource = null;

    /**
     * parse the given JSON data and create all features which are specified in the config for all data entries.
     * @param configPath path to the feature configuration file
     * @param json_data_raw the raw JSON data received from the API
     * @return {Array} array which contains all the configured features for the provided data
     */
    DC.createDataSet = function(configPath, json_data_raw) {
        var json_data = removeIncompleteData(json_data_raw);
        console.log('processing ' + json_data.length + ' filtered data entries out of ' + json_data_raw.length);
        var config = fileToJson(configPath);
        CachedWeatherResponses = fileToJson('json/CachedWeatherRequests.json');
        featureSources = [];
        postProcessSources = [];
        classSource = null;

        // extract the configured features and load the required modules
        console.log('parsing config...');
        config.feature_sources.forEach(function (source) {
            var features = [];
            var isClassKeySource = false;
            source.features.forEach(function (feature) {
                if (source.enabled === true && feature.enabled === true && feature.key !== config.classKey) {
                    features.push(feature);
                }
                else if (feature.key === config.classKey) {
                    isClassKeySource = true;
                }
            });

            if (features.length > 0 || isClassKeySource === true) {
                var module = require(source.path).module;
                var featureKeys = source.features.map(function (feature) {
                    return feature.key;
                });

                if (features.length > 0) {
                    if (source.post_process === true) {
                        postProcessSources.push({
                            "module": module,
                            "name": source.name,
                            "featureGroups": features,
                            "featureGroupKeys": featureKeys
                        });
                    }
                    else {
                        featureSources.push({
                            "module": module,
                            "name": source.name,
                            "features": features,
                            "featureKeys": featureKeys
                        });
                    }
                }

                if (isClassKeySource === true) {
                    classSource = {
                        "module": module,
                        "name": source.name,
                        "classKey": config.classKey
                    }
                }
            }
        });

        dataSet = [];

        //Initialize the script to convert UTC to local time
        console.log('initialize tzwhere...');
        tzwhere.init();

        var classLables = [];

        console.log('creating features...');
        json_data.forEach(function (pokeEntry) {
            var dataRow = {};
            addCoordinatesToPokeEntry(pokeEntry);
            addLocalTime(pokeEntry);

            // add features for the configured feature sources
            featureSources.forEach(function (source) {
                var values = source.module.getFeatures(source.featureKeys, pokeEntry);

                source.features.forEach(function (feature) {
                    dataRow[feature.key] = values[feature.key];
                });
            });
            dataSet.push(dataRow);

            var classLabel = classSource.module.getFeatures([classSource.classKey], pokeEntry);
            classLables.push(classLabel[classSource.classKey]);
        });

        console.log('storing new weather data..');
        saveOldWeather('json/CachedWeatherRequests.json');
        // post processing on existing features

        // save weather data before other processing is done - this way we keep the data if the script crashes below
        console.log('creating post process features...');
        postProcessSources.forEach(function (postSource) {
            dataSet = postSource.module.addFeatures(postSource.featureGroupKeys, dataSet);
        });

        // add the class label to the data row
        console.log('adding class labels...');
        classLables.reverse();
        dataSet.forEach(function (dataRow) {
            dataRow[classSource.classKey] = classLables.pop();
        });

        return dataSet;
    };

    var saveOldWeather = (function(path){//save already retrieved from API data to external JSON file
        fs.writeFileSync(path, JSON.stringify(CachedWeatherResponses, null, 4), 'utf8');
    });

    /**
     * parse the given JSON data and create an .arff file with all features
     * which are specified in the config for all data entries.
     * @param configPath path to the feature configuration file
     * @param json_data_raw the raw JSON data received from the API
     * @param fileNamePath the path with filename where the .arff file should be stored
    */
    DC.storeArffFile = function(configPath, json_data_raw, fileNamePath) {
        DC.createDataSet(configPath, json_data_raw);
        storeArff(fileNamePath);
    };

    /**
     * convert the data set to an .arff file and store it in the arff/ directory with the given filename
     * @param fileNamePath the path with filename where the .arff file should be stored
     */
    function storeArff(fileNamePath) {
        var arff = '@RELATION ' + fileNamePath + '\n\n';

        var addAttributes = function (featureKey, featureType) {
            if (featureType === 'nominal') {
                var nominalValues = allValuesForKeyInData(featureKey, dataSet);
                arff += '@ATTRIBUTE ' + featureKey + ' {' + nominalValues.join(', ') + '}\n';
            } else {
                arff += '@ATTRIBUTE ' + featureKey + ' ' + featureType + '\n';
            }
        };

        // add attributes for the configured features
        featureSources.forEach(function (source) {
            source.features.forEach(function (feature) {
                addAttributes(feature.key, feature.type);
            });
        });

        // add attributes for the configured post processing features
        postProcessSources.forEach(function (postSource) {
            postSource.featureGroups.forEach(function (group) {
                postSource.module.getFeatureKeysForGroup(group.key).forEach(function (feature) {
                    addAttributes(feature, group.type);
                });
            });
        });

        // add the class label
        var classLabels = allValuesForKeyInData(classSource.classKey, dataSet);
        arff += '@ATTRIBUTE class {' + classLabels.join(', ') + '}\n\n';

        // add the data
        arff += '@DATA\n';
        dataSet.forEach(function (dataRow) {
            var values = [];
            for (var key in dataRow) {
                values.push(dataRow[key])
            }
            arff += values.join(',') + '\n';
        });

        fs.writeFileSync(fileNamePath, arff, 'utf8');
    }

    /**
     * get all distinct values for the specified key in the provided data array
     * @param key the key for which the values should be returned
     * @param json_data array of data
     * @returns {Array} all distinct values in the data for the specified key
     */
    function allValuesForKeyInData(key, json_data) {
        var valueSet = new Set();

        json_data.forEach(function (row) {
            valueSet.add(row[key]);
        });

        return Array.from(valueSet);
    }

    /**
     * add latitude and longitude to the Pokemon sighting object for easy access
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     */
    function addCoordinatesToPokeEntry(pokeEntry) {
        pokeEntry.latitude = pokeEntry["location"]["coordinates"][1];
        pokeEntry.longitude = pokeEntry["location"]["coordinates"][0];
    }


    /**
     * add Local Time. Offset is based on coordinates
     * @param _pokeEntry the JSON object which is received from the API for a Pokemon sighting
     */
    function addLocalTime(_pokeEntry) {
        //If at some point a error tracks back to here, it might be that the data team changes Lat/Lon.
        //In this case just exchange the ...[1] and ...[0] in the next line
        var offset = tzwhere.tzOffsetAt(_pokeEntry["location"]["coordinates"][1],_pokeEntry["location"]["coordinates"][0]);
        //add the offset (milliseconds) to date
        var newDate = new Date(_pokeEntry.appearedOn);
        newDate = new Date(newDate.getTime() + offset);
        _pokeEntry.appearedLocalTime = newDate.toJSON();
    }



    /**
     * remove data entries which do not provided all required features
     * @param json_data data to filter
     * @returns {Array} array which contains only entries which provide all necessary features
     */
    function removeIncompleteData(json_data) {
        var complete_data = [];

        json_data.forEach(function (element) {
            if (element["location"] !== null) {
                complete_data.push(element);
            }
        });

        return complete_data;
    }

    /**
     * convert a file into a JSON object
     * @param file relative file path
     * @returns JSON object of the file
     */
    function fileToJson(file) {
        var data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    }
})('undefined' !== typeof module ? module.exports : window);