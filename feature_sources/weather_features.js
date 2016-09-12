//var util = require('util')
var APIKeys = ['4e9bb2e33940272eeea09e0210886de0']//api keys will be stored here
respond={"empty": "json file"};
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest;

(function (exports) {
    var module = exports.module = {};
    module.getFeatures = function (keys, pokeEntry) {
        var values = {}
        var temp = "emptyyet"
        var returnResponse = (function (keys, pokeEntry) {
            //console.log("respond inside returnResponse: " + respond[pokeEntry["_id"]])
            keys.forEach(function (key) {
                if (key === "timezone") {
                    values[key] = respond[pokeEntry["_id"]][0];
                } else if (key === "weather") {
                    values[key] = respond[pokeEntry["_id"]][1]
                } else if (key === "precipType") {
                    values[key] = respond[pokeEntry["_id"]][2]
                } else if (key === "temperature") {
                    values[key] = respond[pokeEntry["_id"]][3]
                } else if (key === "humidity") {
                    values[key] = respond[pokeEntry["_id"]][4]
                } else if (key === "windSpeed") {
                    values[key] = respond[pokeEntry["_id"]][5]
                } else if (key === "windBearing") {
                    values[key] = respond[pokeEntry["_id"]][6]
                } else if (key === "pressure") {
                    values[key] = respond[pokeEntry["_id"]][7]
                }
            })
        });
        if (!respond[pokeEntry["_id"]]) {
            var date = new Date(pokeEntry.appearedLocalTime)
            var timestamp = Math.round(date.getTime() / 1000)
            //switching between API Keys here
            URL = 'https://api.forecast.io/forecast/'+APIKeys[0]+'/'+pokeEntry.latitude+','+pokeEntry.longitude+','+timestamp+''
            xhr.open('GET', URL, false);
            xhr.send();
            if (xhr.status != 200) {
                console.log( "Error occured when making http request. /n"+xhr.status + ': ' + xhr.statusText ); // пример вывода: 404: Not Found
            } else {
                data = JSON.parse(xhr.responseText)
                temp = [data.timezone, data.currently.summary, data.currently.precipType, ((data.currently.temperature - 32) / 1.8).toFixed(1),
                    data.currently.humidity, data.currently.windSpeed, data.currently.windBearing, data.currently.pressure];
            }
            //console.log("API Called")
            respond[pokeEntry["_id"]] = temp
        } else console.log("Api not called")
        returnResponse(keys, pokeEntry)
        //console.log("returning values")
        return values
    }
})('undefined' !== typeof module ? module.exports : window);
