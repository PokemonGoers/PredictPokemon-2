var fs = require('fs');
var DC = require('./dataSet_creator.js').DC;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;



function httpGetAsync(url, destination, callback) {
    console.log('requesting ' + url);

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var apiData = JSON.parse(xmlHttp.responseText);
            console.log('downloaded ' + apiData.data.length + ' sightings from API');
            DS.storeArffFile("feature_config.json", apiData.data.slice(0, 121), destination);

        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
    callback();
}

module.exports = {get: httpGetAsync};