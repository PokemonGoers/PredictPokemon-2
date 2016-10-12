var fs = require('fs');
var DS = require('./dataSet_creator.js').DC;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var url = 'http://pokedata.c4e3f8c7.svc.dockerapp.io:65014/api/pokemon/sighting/';
var destination = 'arff/apiDataExtended.arff';

httpGetAsync(url, destination);

function httpGetAsync(url, destination) {
    console.log('requesting ' +url);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var apiData = JSON.parse(xmlHttp.responseText);
            console.log('downloaded ' +apiData.data.length + ' sightings from API');
            DS.storeArffFile("feature_config.json", apiData.data.slice(0, 121), destination, true);
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
    return xmlHttp.responseText;
}