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
    var classLables = null;
    var consoleOn = false;
    var addCooccurence = true;

    /**
     * parse the given JSON data and create all features which are specified in the config for all data entries.
     * @param configPath path to the feature configuration file
     * @param json_data_raw the raw JSON data received from the API
     * @return {Array} array which contains all the configured features for the provided data
     */
    DC.createDataSet = function(configPath, json_data_raw) {
        var json_data = removeIncompleteData(json_data_raw);
        if (consoleOn) console.log('processing ' + json_data.length + ' filtered data entries out of ' + json_data_raw.length);
        var config = fileToJson(configPath);
        CachedWeatherResponses = fileToJson('json/CachedWeatherRequests.json');
        featureSources = [];
        postProcessSources = [];
        classSource = null;

        // extract the configured features and load the required modules
        if (consoleOn) console.log('parsing config...');
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
        if (consoleOn) console.log('initialize tzwhere...');
        tzwhere.init();

        classLables = [];

        if (consoleOn) console.log('creating features...');
        json_data.forEach(function (pokeEntry) {
            var dataRow = {};
            addCoordinatesToPokeEntry(pokeEntry);
            addLocalTime(pokeEntry);

            // add features for the configured feature sources
            featureSources.forEach(function (source) {
                var values = source.module.getFeatures(source.featureKeys, pokeEntry);
                if (values != "Error with request") {
                    source.features.forEach(function (feature) {
                        dataRow[feature.key] = values[feature.key];
                    });
                } else dataRow = null;
            });
            if (dataRow != null)dataSet.push(dataRow);

            var classLabel = classSource.module.getFeatures([classSource.classKey], pokeEntry);
            classLables.push(classLabel[classSource.classKey]);
        });
        // post processing on existing features

        // save weather data before other processing is done - this way we keep the data if the script crashes below
        if (consoleOn) console.log('creating post process features...');
        postProcessSources.forEach(function (postSource) {
            dataSet = postSource.module.addFeatures(postSource.featureGroupKeys, dataSet);
        });

        if (!addCooccurence) {
            // add the class label to the data row
            if (consoleOn) console.log('adding class labels...');
            classLables.reverse();
            dataSet.forEach(function (dataRow) {
                dataRow[classSource.classKey] = classLables.pop();
            });
        }

        return dataSet;
    };

    saveOldWeather = (function(path, consoleOutput){//save already retrieved from API data to external JSON file
        fs.writeFileSync(path, JSON.stringify(CachedWeatherResponses, null, 4), 'utf8');
        if (consoleOutput) console.log("Saved weather data")
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
        if (addCooccurence) {
            //add cooc labels
            for (var i = 1; i <= 151; i++) {
                arff += "@ATTRIBUTE cooc_" + i + " {false, true}\n";
            }

            //init the datastructure for cooc
            var cooc = [];
            cooc = initCoocs(dataSet);
            //compute the cooccurence
            computeCooc(cooc);
        }
        // add the class label
        var classLabels = allValuesForKeyInData(classSource.classKey, dataSet);
        arff += '@ATTRIBUTE class {' + classLabels.join(', ') + '}\n\n';

        // add the data
        arff += '@DATA\n';

        if(!addCooccurence) {
            dataSet.forEach(function (dataRow) {
                var values = [];
                for (var key in dataRow) {
                    values.push(dataRow[key])
                }
                arff += values.join(',') + '\n';
            });

            fs.writeFileSync(fileNamePath, arff, 'utf8');
        } else {
            fs.writeFileSync(fileNamePath, arff, 'utf8');
            if(consoleOn) console.log("Wrote the header.");
            var len = dataSet.length;
            var values = [];
            var row = null;
            for(var i=0; i<len;i++){
                values = [];
                //all the features
                row = dataSet.shift();
                //cooccurences
                for(var i = 1; i <=151; i++){
                    row['cooc_' + i] = (cooc[iter]["cooccurCellId90_" + (32*Math.floor(i/32))] & (1<<(i%32)))!==0;
                }
                //class labels
                row[classSource.classKey] = classLables.shift();

                //extract values
                for (var key in row) {
                    values.push(row[key])
                }
                arff += values.join(',') + '\n';
                if(i%5000===0||iter===(len-1)){
                    console.log("Writing...");
                    if (i===(len-1)){
                        arff=arff.slice(0,-2);
                        fs.appendFileSync(fileNamePath, arff, 'utf8');
                    } else {
                        fs.appendFileSync(fileNamePath, arff, 'utf8');
                        arff = "";
                    }
                    if(consoleOn) console.log("" + i + " instances written.");
                }
            }
        }
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


    /**
     * Initializes the data structure for the cooccurence to work on
     * that is: 5 Integers to hold the "boolean" values
     * @param _data The data for which the cooccurence is added
     * @returns {Array} data struc for cooccurence
     */
    function initCoocs (_data){
        var coocData = [];
        //iter to run along the forEach loop and fethc the labels.
        var iter = 0;
        _data.forEach(function(row) {
            var name = "cooccurCellId90_";
            var new_row = {};
            new_row['_id'] = row['_id'];
            new_row['cellId_90m'] = row['cellId_90m'];
            new_row['appearedHour'] = row['appearedHour'];
            new_row['appearedDay'] = row['appearedDay'];
            new_row['appearedMonth'] = row['appearedMonth'];
            new_row['pokemonId'] = classLables[iter];
            new_row[name + "0"] = 0;
            new_row[name + "32"] = 0;
            new_row[name + "64"] = 0;
            new_row[name + "96"] = 0;
            new_row[name + "128"] = 0;
            coocData.push(new_row);
            iter ++;
        });
        console.log("Initialized cooc var with " + coocData.length + " rows.");
        return coocData;
    }

    /**
     * traverses the data and adds cooccurence, if the sighting was in the same cell
     * and in the same timeframe
     * @param _data the cooc-structure to work on
     */
    function computeCooc (_data){
        var count_cooc=0;
        var count_cell=0;
        var sum = (_data.length+1)*_data.length/2;
        for(var i = 0;i <_data.length; i++){
            if(i%100 == 0){
                var current = i*100/_data.length;
                console.log("Roughly at " + current.toFixed(2) + "% of co-occurence computations with " + count_cooc +
                    " co-occurrences in "+ count_cell + " cell hits.");
            }
            for(var j = 0; j<_data.length; j++){
                if(i!=j) {
                    if (_data[i].cellId_90m === _data[j].cellId_90m) {
                        count_cell++;
                        if (within24(_data[i], _data[j])) {
                            if (_data[i].pokemonId !== _data[j].pokemonId) {
                                insert_id_to_int(_data[i], _data[j]);
                                count_cooc++;
                            }
                        }
                    }
                }
            }
        }
    }

    /**returns whether or not the sighting data2 was within the hour before data1
     *
     * @param The tuple the cooccurence will be inserted in
     * @param The tuple, which is in the same cell.
     * @returns {boolean} whether the occurence was within the same hour / hour before
     */
    function within24(data1, data2){
        //console.log(data1.appearedHour + " and " + data2.appearedHour + " and "
        //    +data1.class + " and " + data2.class);
        if(data1.appearedHour==data2.appearedHour
            ||(data1.appearedHour-1)==data2.appearedHour
            ||(data1.appearedHour==0&&data2.appearedHour==23)){
            return true;
        } else {
            return false;
        }
    }


    /**
     * Magic. Do not touch.
     *
     * @param data_1 The tuple the information is stored in
     * @param data_2 The tuple that contains the cooccurence
     */
    function insert_id_to_int(data_1, data_2){
        var str = 'cooccurCellId90_';
        var int_1 = Math.floor(data_1.pokemonId/32);
        var int_2 = Math.floor(data_2.pokemonId/32);
        data_2[str + (int_1*32)] = data_2[str + (int_1*32)] | (1<<(data_1.pokemonID%32));
        data_1[str + (int_2*32)] = data_1[str + (int_2*32)] | (1<<(data_2.pokemonId%32));
    }

})('undefined' !== typeof module ? module.exports : window);