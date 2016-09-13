var APIKeys = ['4e9bb2e33940272eeea09e0210886de0','49b8958cdb735261a244a5cb0edbf9a7','57e3c5edfc29d014491232d0ffb99aa0']//api keys will be stored here
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest;
var moment = require('moment-timezone');

(function (exports) {
    var module = exports.module = {};

    module.getFeatures = function (keys, pokeEntry) {
        var values = {};
        var temp = "emptyyet";
        var consoleOn = false;                                                                   //turns on/off console output

        var returnResponse = (function (keys, pokeEntry) {
            //console.log("respond inside returnResponse: " + CachedWeatherResponses[pokeEntry["_id"]])
            keys.forEach(function (key) {
                if (key === "city") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][0];
                } else if (key === "continent") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][1];
                } else if (key === "weather") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][2];
                } else if (key === "temperature") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][3];
                } else if (key === "humidity") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][4];
                } else if (key === "windSpeed") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][5];
                } else if (key === "windBearing") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][6];
                } else if (key === "pressure") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][7];
                } else if (key === "weatherIcon") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][8];
                } else if (key === "sunriseMinutesMidnight") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][9];
                } else if (key === "sunriseHour") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][10];
                } else if (key === "sunriseMinute") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][11];
                } else if (key === "sunriseMinutesSince") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][12];
                } else if (key === "sunsetMinutesMidnight") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][13];
                } else if (key === "sunsetHour") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][14];
                } else if (key === "sunsetMinute") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][15];
                } else if (key === "sunsetMinutesBefore") {
                    values[key] = CachedWeatherResponses[pokeEntry["_id"]][16];
                }
            })
        });
        var makeRequest = (function () {
            var date = new Date(pokeEntry.appearedLocalTime);
            var timestamp = Math.round(date.getTime() / 1000);
            //switching between API Keys here
            var URL = 'https://api.forecast.io/forecast/'+APIKeys[WeatherApiKey]+'/'+pokeEntry.latitude+','+pokeEntry.longitude+','+timestamp+''
            xhr.open('GET', URL, false);
            xhr.send();
            if (xhr.status != 200) {
                console.log( "Error occured when making http request. /n"+xhr.status + ': ' + xhr.statusText ); // пример вывода: 404: Not Found
            } else {
                if (xhr.responseText.substring(0,12) != '{"latitude":' && WeatherApiKey<(APIKeys.length-1)) {//I don't know what it returns when requests limit is exceeded yet
                    WeatherApiKey++;                            //so if first 12 symbold of response are not equal '{"latitude":', then API Key probably doesn't work anymore
                    if (consoleOn) console.log("Changed API Key");
                    makeRequest()
                } else {
                    if (consoleOn) console.log(xhr.responseText);
                    data = JSON.parse(xhr.responseText);
                    j = 0;
                    for (i=0; i<data.timezone.length; i++){
                        if (data.timezone.charAt(i)=='/') {
                            j=i;
                        }
                    }
                    var continent = data.timezone.substring(0,j);
                    var city = data.timezone.substring(j+1);
                    var city = data.timezone.substring(j+1);
                    var sunrise = sunTimeFeatures(data.daily.data[0].sunriseTime, data.currently.time, data.timezone);
                    var sunset = sunTimeFeatures(data.daily.data[0].sunsetTime, data.currently.time, data.timezone);

                    temp = [city, continent, data.currently.summary.replace(/\s+/g, ''),
                        ((data.currently.temperature - 32) / 1.8).toFixed(1), data.currently.humidity,
                        data.currently.windSpeed, data.currently.windBearing, data.currently.pressure, data.currently.icon,
                        sunrise.minutesSinceMidnight, sunrise.hour, sunrise.minute, sunrise.minutesSince,
                        sunset.minutesSinceMidnight, sunset.hour, sunset.minute, -sunset.minutesSince/* -minutesSince to get the time before*/];
                }
            }
            if (consoleOn)console.log("API Called");
            CachedWeatherResponses[pokeEntry["_id"]] = temp
        });

        if (!CachedWeatherResponses[pokeEntry["_id"]]) {
            makeRequest()
        }
        else if (consoleOn) {
            console.log("Weather Api not called, loaded existing data");         
        }
        returnResponse(keys, pokeEntry);
        return values;
    };

    /**
     * time features relating to the sunrise and sunset time
     **/
    function sunTimeFeatures(sunTimestamp, currentTimestamp, timezone) {
        var sunDate = moment.unix(sunTimestamp).tz(timezone);
        var currentDate = moment.unix(currentTimestamp).tz(timezone);
        return {
            "minutesSinceMidnight": minutesSinceMidnight(sunDate),
            "hour": sunDate.hours(),
            "minute": sunDate.minutes(),
            "minutesSince": minutesSinceMidnight(currentDate) - minutesSinceMidnight(sunDate)
            };
    }

    function minutesSinceMidnight(momentDate) {
        return momentDate.hours()*60 + momentDate.minutes()
    }
})('undefined' !== typeof module ? module.exports : window);
