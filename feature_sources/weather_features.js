var APIKeys = ['4e9bb2e33940272eeea09e0210886de0','49b8958cdb735261a244a5cb0edbf9a7','57e3c5edfc29d014491232d0ffb99aa0']//api keys will be stored here
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest;

(function (exports) {
    var module = exports.module = {};
    module.getFeatures = function (keys, pokeEntry) {
        //console.log(OldAPIrequests)
        var values = {}
        var temp = "emptyyet"
        var returnResponse = (function (keys, pokeEntry) {
            //console.log("respond inside returnResponse: " + OldAPIrequests[pokeEntry["_id"]])
            keys.forEach(function (key) {
                if (key === "city") {
                    values[key] = OldAPIrequests[pokeEntry["_id"]][0];
                } else if (key === "continent") {
                    values[key] = OldAPIrequests[pokeEntry["_id"]][1];
                } else if (key === "weather") {
                    values[key] = OldAPIrequests[pokeEntry["_id"]][2]
                } else if (key === "temperature") {
                    values[key] = OldAPIrequests[pokeEntry["_id"]][3]
                } else if (key === "humidity") {
                    values[key] = OldAPIrequests[pokeEntry["_id"]][4]
                } else if (key === "windSpeed") {
                    values[key] = OldAPIrequests[pokeEntry["_id"]][5]
                } else if (key === "windBearing") {
                    values[key] = OldAPIrequests[pokeEntry["_id"]][6]
                } else if (key === "pressure") {
                    values[key] = OldAPIrequests[pokeEntry["_id"]][7]
                }
            })
        });
        var makeRequest = (function () {
            var date = new Date(pokeEntry.appearedLocalTime)
            var timestamp = Math.round(date.getTime() / 1000)
            //switching between API Keys here
            var URL = 'https://api.forecast.io/forecast/'+APIKeys[WeatherApiKey]+'/'+pokeEntry.latitude+','+pokeEntry.longitude+','+timestamp+''
            xhr.open('GET', URL, false);
            xhr.send();
            if (xhr.status != 200) {
                console.log( "Error occured when making http request. /n"+xhr.status + ': ' + xhr.statusText ); // пример вывода: 404: Not Found
            } else {
                if (xhr.responseText.substring(0,12) != '{"latitude":'&&WeatherApiKey<(APIKeys.length-1)) {//I don't know what it returns when requests limit is exceeded yet
                    WeatherApiKey++;                            //so if first 12 symbold of response are not equal '{"latitude":', then API Key probably doesn't work anymore
                    console.log("Changed API Key")
                    makeRequest()
                } else {
                    //console.log(xhr.responseText)
                    data = JSON.parse(xhr.responseText)
                    j = 0;
                    for (i=0; i<data.timezone.length; i++){
                        if (data.timezone.charAt(i)=='/') j=i;}
                    continent = data.timezone.substring(0,j)
                    city = data.timezone.substring(j+1)
                    temp = [city, continent, data.currently.summary, data.currently.precipType, ((data.currently.temperature - 32) / 1.8).toFixed(1),
                        data.currently.humidity, data.currently.windSpeed, data.currently.windBearing, data.currently.pressure];
                }
            }//console.log("API Called")
            OldAPIrequests[pokeEntry["_id"]] = temp
        });
        if (!OldAPIrequests[pokeEntry["_id"]]) makeRequest()
        //else console.log("Weather Api not called, loaded existing data")
        returnResponse(keys, pokeEntry)
        return values
    }
})('undefined' !== typeof module ? module.exports : window);
