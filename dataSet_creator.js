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
    var consoleOn = false;

    /**
     * parse the given JSON data and create all features which are specified in the config for all data entries.
     * @param configPath path to the feature configuration file
     * @param json_data_raw the raw JSON data received from the API
     * @return {Array} array which contains all the configured features for the provided data
     */
    DC.createDataSet = function(configPath, json_data_raw, fileNamePath) {
        var json_data = removeIncompleteData(json_data_raw);
        if (consoleOn) console.log('processing ' + json_data.length + ' filtered data entries out of ' + json_data_raw.length);
        var config = fileToJson(configPath);
        //CachedWeatherResponses = fileToJson('json/CachedWeatherRequests.json');
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
                    if (consoleOn) console.log(feature.key);
                    features.push(feature);
                }
                else if (feature.key === config.classKey) {
                    if (consoleOn) console.log("class key: " + feature.key);
                    isClassKeySource = true;
                    features.push(feature);
                }
            });

            if (features.length > 0 || isClassKeySource === true) {
                var module = require(source.path).module;
                var featureKeys= source.features.filter(function(feature) {
                    return feature.enabled;
                }).map(function(feature) { return feature.key; });

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
        //console.log(featureSources);
        dataSet = [];

        var classLables = [];
        var cnt = 0;
        if (consoleOn) console.log('creating features...');

        storeArff(fileNamePath);

        json_data.forEach(function (pokeEntry) {
            var dataRow = {};
            cnt++;
            if (cnt % 1000 == 0) console.log("Current tuple: " + cnt);

            // add features for the configured feature sources
            featureSources.forEach(function (source) {
                //console.log(source.featureKeys);
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
        // add the class label to the data row
        if (consoleOn) console.log('adding class labels...');
        classLables.reverse();
        dataSet.forEach(function (dataRow) {
            dataRow[classSource.classKey] = classLables.pop();
        });


        console.log("The var dataSet contains " + dataSet.length + " entries.")

        //compute co-occurence
        //console.log(dataSet);
        var cooc = [];
        cooc = initCoocs(dataSet);
        computeCooc(cooc);

        var iter = 0;
        var finalData = [];
        dataSet.forEach(function (pokeEntry) {
            var dataRow = pokeEntry;
            for(var i = 1; i <=151; i++){
                dataRow['cooc_' + i] = (cooc[iter]["cooccurCellId90_" + (32*Math.floor(i/32))] & (1<<(i%32)))!==0;
            }
            finalData.push(dataRow)
            iter++;

            if(iter%5000==0){
                var arff = "";

                finalData.forEach(function (data) {
                    var values = [];
                    for (var key in data) {
                        values.push(data[key])
                    }
                    arff += values.join(',') + '\n';
                });
                console.log("Writing...");
                console.log(arff.length);
                fs.appendFileSync(fileNamePath, arff, 'utf8');
                finalData = [];
                console.log("" + iter + " instances written.");
            }
        });


        if (consoleOn) console.log('adding class labels...');
        classLables.reverse();
        finalData.forEach(function (data) {
            data[classSource.classKey] = classLables.pop();
        });
        var arff = "";
        cnt = 0;
        finalData.forEach(function (data) {
            var values = [];
            for (var key in data) {
                values.push(data[key])
            }
            arff += values.join(',') + '\n';
            cnt++;
            if(cnt%5000){
                console.log("Writing...");
                fs.appendFileSync(fileNamePath, arff, 'utf8');
                arff="";
                console.log("" + cnt + " instances written.");
            }
        });


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
        DC.createDataSet(configPath, json_data_raw, fileNamePath);
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

function initCoocs (_data){
    var coocData = [];
    _data.forEach(function(row) {
        var name = "cooccurCellId90_";
        var new_row = {};
        new_row['_id'] = row['_id'];
        new_row['cellId_90m'] = row['cellId_90m'];
        new_row['appearedHour'] = row['appearedHour'];
        new_row['appearedDay'] = row['appearedDay'];
        new_row['appearedMonth'] = row['appearedMonth'];
        new_row['pokemonId'] = row['pokemonId'];
        new_row[name + "0"] = 0;
        new_row[name + "32"] = 0;
        new_row[name + "64"] = 0;
        new_row[name + "96"] = 0;
        new_row[name + "128"] = 0;
        coocData.push(new_row);
    });
    console.log("Initialized cooc var with " + coocData.length + " rows.");
    return coocData;
}

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

//returns whether or not the sighting data2 was within the hour before data1
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

//Magic. Do not touch.
function insert_id_to_int(data_1, data_2){
    var str = 'cooccurCellId90_';
    var int_1 = Math.floor(data_1.class/32);
    var int_2 = Math.floor(data_2.class/32);
    data_2[str + (int_1*32)] = data_2[str + (int_1*32)] | (1<<(data_1.class%32));
    data_1[str + (int_2*32)] = data_1[str + (int_2*32)] | (1<<(data_2.class%32));
}