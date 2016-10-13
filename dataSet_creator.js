var fs = require('fs');
var tzwhere = require('tzwhere');
WeatherApiKey = 0;// Identifies which API Key is used right now. Has to be here to be global
CachedWeather= {"Aye aye,":"captain"};
WeatherApiKeyCounter=0;

(function (exports) {
    var DC = exports.DC = {};
    var dataSet = null;
    var featureSources = null;
    var postProcessSources = null;
    var classSource = null;
    var classLables = null;
    var consoleOn = true;
    var addCooccurence = true;
    var coocTraingData = null;
    var arffTrainingHeader = '';
    DC.existingPokemonID = 16;
    DC.cooccClasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151];


    /**
     * parse the given JSON config and initialize DC.
     * @param configPath path to the feature configuration file
     * @param useApiData indicate if the raw json data is from the API or not
     */
    DC.init = function (configPath, useApiData) {
        if (useApiData === 'undefined' || useApiData === null) {
            useApiData = true;
        }
        if (consoleOn) console.log('initializing DC');
        var config = fileToJson(configPath);
        CachedWeather = fileToJson('json/CachedWeather.json');
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
                    features.push(feature);
                    isClassKeySource = true;
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

        //Initialize the script to convert UTC to local time
        if (useApiData) {
            if (consoleOn) console.log('initialize tzwhere...');
            tzwhere.init();
        }
    };

    /**
     * parse the given JSON data and create all features which are specified in the config for all data entries.
     * @param json_data_raw the raw JSON data received from the API
     * @param useApiData indicate if the raw json data is from the API or not
     * @return {Array} array which contains all the configured features for the provided data. Default true.
     */
    DC.createDataSet = function(json_data_raw, useApiData) {
        if (useApiData === 'undefined' || useApiData === null) {
            useApiData = true;
        }
        var json_data = removeIncompleteData(json_data_raw);
        if (consoleOn) console.log('processing ' + json_data.length + ' filtered data entries out of ' + json_data_raw.length);
        var cnt = 0;
        dataSet = [];
        classLables = [];
        if (consoleOn) console.log('creating features...');

        json_data.forEach(function (pokeEntry) {

            var dataRow = {};

            if (useApiData) {
                addCoordinatesToPokeEntry(pokeEntry);
                addLocalTime(pokeEntry);
            }

            // add features for the configured feature sources
            var errorFlag=false;
            featureSources.forEach(function (source) {
                if(!errorFlag){
                    var values = source.module.getFeatures(source.featureKeys, pokeEntry);
                    if (values != "Error with request") {
                        source.features.forEach(function (feature) {
                            dataRow[feature.key] = values[feature.key];
                        });
                    } else errorFlag=true;
                }
            });
            if (!errorFlag) {
                dataSet.push(dataRow);
                var classLabel = classSource.module.getFeatures([classSource.classKey], pokeEntry);
                classLables.push(classLabel[classSource.classKey]);
            }

            if(consoleOn && ((cnt%1000) ===0)){
                console.log("At tuple # " + cnt);
            }
            cnt++;
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
            dataSet.forEach(function (dataRow) {
                dataRow[classSource.classKey] = classLables.shift();
            });
        }

        return dataSet;
    };

    saveOldWeather = (function(path, what, consoleOutput){//save already retrieved from API data to external JSON file
        fs.writeFileSync(path, JSON.stringify(what, null, 4), 'utf8');
        if (consoleOutput) console.log("Saved weather data")
    });

    /**
     * parse the given JSON data and create an .arff file with all features
     * which are specified in the config for all data entries.
     * @param json_data_raw the raw JSON data received from the API
     * @param fileNamePath the path with filename where the .arff file should be stored
     * @param useApiData indicate if the raw json data is from the API or not
     * @param useCoocTraingData indicate if the stored cooc data should be used for the calculation of the cooc. Needed if a test file will be created.
     */
    DC.storeArffFile = function(json_data_raw, fileNamePath, useApiData, useCoocTraingData ) {
        DC.createDataSet(json_data_raw, useApiData);
        var cooc = storeArff(fileNamePath, useCoocTraingData ? coocTraingData : null);
        if (!useCoocTraingData) {
            coocTraingData = cooc;
        }
    };

    function createArffHeader(fileNamePath, coocTraingData) {
        var arff = '@RELATION ' + fileNamePath + '\n\n';

        var addAttributes = function (source, featureKey, featureType) {
            if (featureType == 'nominal') {
                //var nominalValues = allValuesForKeyInData(featureKey, dataSet);
                var nominalValues = source.module.getNominalValues(featureKey);
                arff += '@ATTRIBUTE ' + featureKey + ' {' + nominalValues.join(', ') + '}\n';
            } else {
                arff += '@ATTRIBUTE ' + featureKey + ' ' + featureType + '\n';
            }
        };

        // add attributes for the configured features
        featureSources.forEach(function (source) {
            source.features.forEach(function (feature) {
                if (feature.key !== 'pokemonId') {
                    addAttributes(source, feature.key, feature.type);
                }
            });
        });

        // add attributes for the configured post processing features
        postProcessSources.forEach(function (postSource) {
            postSource.featureGroups.forEach(function (group) {
                postSource.module.getFeatureKeysForGroup(group.key).forEach(function (feature) {
                    addAttributes(postSource, feature, group.type);
                });
            });
        });
        if (addCooccurence) {
            //add cooc labels
            DC.cooccClasses.forEach(function (pokeId) {
                arff += "@ATTRIBUTE cooc_" + pokeId + " {false, true}\n";
            });
        }

        // add the class label
        //var classLabelAttributes = allValuesForKeyInData(classSource.classKey, dataSet);
        var classLabelAttributes = classSource.module.getNominalValues(classSource.classKey);
        arff += '@ATTRIBUTE class {' + classLabelAttributes.join(', ') + '}\n\n';
        return arff;
    }

    /**
     * convert the data set to an .arff file and store it in the arff/ directory with the given filename
     * @param fileNamePath the path with filename where the .arff file should be stored
     * @param coocTraingData the cooc from the training data which can be used for the calulation of the test data cooc. Can be null for creating training data.
     */
    function storeArff(fileNamePath, coocTraingData) {
        arff = '';

        if (coocTraingData  === 'undefined' || coocTraingData === null) {
            arff  = createArffHeader(fileNamePath, coocTraingData);
            arffTrainingHeader = arff;
        }
        else {
            arff = arffTrainingHeader;
        }

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
            //init the datastructure for cooc
            var cooc = [];
            cooc = initCoocs(dataSet);
            //compute the cooccurence
            computeCooc(cooc, coocTraingData);

            fs.writeFileSync(fileNamePath, arff, 'utf8');
            arff="";
            if(consoleOn) console.log("Wrote the header.");
            var len = dataSet.length;
            var values = [];
            var row = null;
            for(var i=0; i<len;i++){
                values = [];
                //all the features
                row = dataSet.shift();
                //cooccurences
                DC.cooccClasses.forEach(function (pokeId) {
                    row['cooc_' + pokeId] = (cooc[i]["cooccurCellId90_" + (32*Math.floor(pokeId/32))] & (1<<(pokeId%32)))!==0;
                });
                //class labels
                //this is hardcoded, because cooccurence needs the pokemonId, but Weka prefers the class in the end
                row["class"] = classLables.shift();
                // do not add pokemonId as we want to predict it
                if (row.hasOwnProperty('pokemonId')) {
                    delete row.pokemonId;
                }

                //extract values
                for (var key in row) {
                    values.push(row[key])
                }
                arff += values.join(',') + '\n';
                if(i%5000===0||i===(len-1)){
                    console.log("Writing...");
                    if (i===(len-1)){
                        fs.appendFileSync(fileNamePath, arff, 'utf8');
                    } else {
                        fs.appendFileSync(fileNamePath, arff, 'utf8');
                        arff = "";
                    }
                    if(consoleOn) console.log("" + i + " instances written.");
                }
            }
        }

        return cooc;
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

        var array = Array.from(valueSet);
        // check if we have numbers as values, if so sort them
        if (!isNaN(parseFloat(array[0]))) {
            array.sort(
                function sortNumber(a,b) {
                    return a - b;
            });
        }

        return array;
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
    function computeCooc (_data1, _data2){
        if (_data2 === 'undefined' || _data2 === null) {
            _data2 = _data1;
        }
        var count_cooc=0;
        var count_cell=0;
        for(var i = 0;i <_data1.length; i++){
            if(i%100 == 0){
                var current = i*100/_data1.length;
                console.log("Roughly at " + current.toFixed(2) + "% of co-occurence computations with " + count_cooc +
                    " co-occurrences in "+ count_cell + " cell hits.");
            }
            var start = 0;
            if (_data1 === _data2) {
                start = i+1;
            }
            for(var j = start; j<_data2.length; j++){
                if (_data1[i].cellId_90m === _data2[j].cellId_90m) {
                    count_cell++;
                    if (within24(_data1[i], _data2[j])) {
                        if (_data1[i].pokemonId !== _data2[j].pokemonId) {
                            insert_id_to_int(_data1[i], _data2[j]);
                            count_cooc++;
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
        data_2[str + (int_1*32)] = data_2[str + (int_1*32)] | (1<<(data_1.pokemonId%32));
        data_1[str + (int_2*32)] = data_1[str + (int_2*32)] | (1<<(data_2.pokemonId%32));
    }

})('undefined' !== typeof module ? module.exports : window);