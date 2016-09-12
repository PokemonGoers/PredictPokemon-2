var fs = require('fs');
var DS = require('./dataSet_creator.js').DC;
var destination = 'arff/apiDataMockup.arff';
//test script made to test weather features without losing too many API requests
SOMEDATA=[  {"_id":"57c92f926ffa1ace02c48f04","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:21.000Z","__v":0,"pokemonId":73,"location":{"coordinates":[151.199544,-33.871224],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f01","source":"POKESNIPER","appearedOn":"2016-09-02T07:52:57.000Z","__v":0,"pokemonId":122,"location":{"coordinates":[22.411684,40.791931],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f03","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:14.000Z","__v":0,"pokemonId":97,"location":{"coordinates":[14.030339,50.684582],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f05","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:24.000Z","__v":0,"pokemonId":143,"location":{"coordinates":[151.207102,-33.859318],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f06","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:38.000Z","__v":0,"pokemonId":117,"location":{"coordinates":[-74.007198,40.718725],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f07","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:47.000Z","__v":0,"pokemonId":18,"location":{"coordinates":[-119.029218,35.426861],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f08","source":"POKESNIPER","appearedOn":"2016-09-02T07:54:09.000Z","__v":0,"pokemonId":138,"location":{"coordinates":[-99.199814,19.411314],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f09","source":"POKESNIPER","appearedOn":"2016-09-02T07:54:16.000Z","__v":0,"pokemonId":33,"location":{"coordinates":[-83.92087,9.857945],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f02","source":"POKESNIPER","appearedOn":"2016-09-02T07:53:04.000Z","__v":0,"pokemonId":99,"location":{"coordinates":[-122.441549,37.775157],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f0c","source":"POKESNIPER","appearedOn":"2016-09-02T07:54:34.000Z","__v":0,"pokemonId":30,"location":{"coordinates":[-73.98507,40.761295],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f0e","source":"POKESNIPER","appearedOn":"2016-09-02T07:55:30.000Z","__v":0,"pokemonId":85,"location":{"coordinates":[139.69006,35.690639],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f0a","source":"POKESNIPER","appearedOn":"2016-09-02T07:54:30.000Z","__v":0,"pokemonId":147,"location":{"coordinates":[151.199635,-33.871647],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f0b","source":"POKESNIPER","appearedOn":"2016-09-02T07:55:07.000Z","__v":0,"pokemonId":22,"location":{"coordinates":[2.372269,48.882607],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f0f","source":"POKESNIPER","appearedOn":"2016-09-02T07:55:09.000Z","__v":0,"pokemonId":49,"location":{"coordinates":[114.020135,22.441249],"type":"Point"}},
    {"_id":"57c92f926ffa1ace02c48f10","source":"POKESNIPER","appearedOn":"2016-09-02T07:55:32.000Z","__v":0,"pokemonId":95,"location":{"coordinates":[-74.018399,40.708029],"type":"Point"}}    ];


DS.storeArffFile("feature_config.json", SOMEDATA, destination);