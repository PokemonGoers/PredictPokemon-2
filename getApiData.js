var fs = require('fs');
var DC = require('./dataSet_creator.js').DC;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


storeApiData();

<<<<<<< HEAD
function httpGetAsync(url, destination, callback) {
    console.log('requesting ' + url);
=======
function storeApiData() {
    var data = getData(function (data) {
        DC.init("feature_config.json", true);
        DC.storeArffFile(data.slice(0, 121), destination, true);
    });
}

function getData(callback) {
    console.log('requesting ' +url);
>>>>>>> develop
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var apiData = JSON.parse(xmlHttp.responseText);
<<<<<<< HEAD
            console.log('downloaded ' + apiData.data.length + ' sightings from API');
            DS.storeArffFile("feature_config.json", apiData.data.slice(0, 121), destination);
=======
            console.log('downloaded ' +apiData.data.length + ' sightings from API');
            callback(apiData.data);
>>>>>>> develop
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
    callback();
}

module.exports = {get: httpGetAsync};