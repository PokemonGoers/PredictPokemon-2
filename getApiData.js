var fs = require('fs');
var DC = require('./dataSet_creator.js').DC;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';
var destination = 'arff/apiDataExtended.arff';

storeApiData();

function storeApiData() {
    var data = getData(function (data) {
        DC.init("feature_config.json", true);
        DC.storeArffFile(data.slice(0, 121), destination, true, false);
    });
}

function getData(callback) {
    console.log('requesting ' +url);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var apiData = JSON.parse(xmlHttp.responseText);
            console.log('downloaded ' +apiData.data.length + ' sightings from API');
            callback(apiData.data);
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
    return xmlHttp.responseText;
}