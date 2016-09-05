var fs = require('fs');

(function (exports) {
    var DC = exports.DC = {};
    var dataSet = null;
    var featureSources = null;
    var classSource = null;

    /**
     * parse the given JSON data and create all features which are specified in the config for all data entries.
     * @param configPath path to the feature configuration file
     * @param json_data_raw the raw JSON data received from the API
     * @return {Array} array which contains all the configured features for the provided data
     */
    DC.createDataSet = function(configPath, json_data_raw) {
        var json_data = removeIncompleteData(json_data_raw);
        var config = fileToJson(configPath);
        featureSources = [];
        classSource = null;

        // extract the configured features and load the required modules
        config.feature_sources.forEach(function (source) {
            var features = [];
            var isClassKeySource = false;
            source.features.forEach(function (feature) {
                if (feature.enabled === true && feature.key !== config.classKey) {
                    features.push(feature);
                }
                else if (feature.key === config.classKey) {
                    isClassKeySource = true;
                }
            });

            if (features.length > 0 || isClassKeySource === true) {
                var module = require(source.path).module;

                if (features.length > 0) {
                    featureSources.push({
                        "module": module,
                        "name": source.name,
                        "features": features
                    });
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

        json_data.forEach(function (pokeEntry) {
            var dataRow = {};
            addCoordinatesToPokeEntry(pokeEntry);

            // add features for the configured feature sources
            featureSources.forEach(function (source) {
                source.features.forEach(function (feature) {
                    var value = source.module.getFeature(feature.key, pokeEntry);
                    dataRow[feature.key] = value;
                });
            });

            // add the class label to the data row
            var classLabel = classSource.module.getFeature(classSource.classKey, pokeEntry);
            dataRow[classSource.classKey] = classLabel;

            dataSet.push(dataRow);
        });

        return dataSet;
    };

    /**
     * parse the given JSON data and create an .arff file with all features
     * which are specified in the config for all data entries.
     * @param configPath path to the feature configuration file
     * @param json_data_raw the raw JSON data received from the API
     * @param fileNamePath the path with filename where the .arff file should be stored
    */
    DC.storeArffFile = function(configPath, json_data_raw, fileNamePath) {
        DC.createDataSet(configPath, json_data_raw);
        storeArff(dataSet, featureSources, classSource, fileNamePath);
    };

    /**
     * convert the data set to an .arff file and store it in the arff/ directory with the given filename
     * @param dataSet the data to be stored
     * @param featureSources the configured feature sources from the config
     * @param classSource the source for the class label
     * @param fileNamePath the path with filename where the .arff file should be stored
     */
    function storeArff(dataSet, featureSources, classSource, fileNamePath) {
        var arff = '@RELATION ' + fileNamePath + '\n\n';

        // add attributes for the configured features
        featureSources.forEach(function (source) {
            source.features.forEach(function (feature) {
                if (feature.type === 'nominal') {
                    var nominalValues = allValuesForKeyInData(feature.key, dataSet);
                    arff += '@ATTRIBUTE ' + feature.key + ' {' + nominalValues.join(', ') + '}\n';
                } else {
                    arff += '@ATTRIBUTE ' + feature.key + ' ' + feature.type + '\n';
                }
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
        pokeEntry.latitude = pokeEntry["location"]["coordinates"][0];
        pokeEntry.longitude = pokeEntry["location"]["coordinates"][1];
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