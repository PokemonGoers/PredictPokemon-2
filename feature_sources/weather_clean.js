var APIKeys = ['4e9bb2e33940272eeea09e0210886de0','49b8958cdb735261a244a5cb0edbf9a7','57e3c5edfc29d014491232d0ffb99aa0']//api keys will be stored here
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest;
var moment = require('moment-timezone');
var S2 = require('s2-geometry').S2;
var util = require('util')
var consoleOn = false;     //turns on/off console output
var showErrors = false;
var values;
var temp = "emptyyet";
var CacheKey = "";

(function (exports) {
    var module = exports.module = {};

    module.getFeatures = function (keys, pokeEntry) {
        values = {};
        //S2_cell: level 11, time: 12 parts of the day
        var CacheKey="S2_cell: "+getS2Cell(pokeEntry.latitude, pokeEntry.longitude)+", time:"+getTime(pokeEntry.appearedLocalTime);                                                            //turns on/off console output

        var returnResponse = (function (keys, pokeEntry) {
            //console.log("respond inside returnResponse: " + CachedWeatherResponses[pokeEntry["_id"]])
            keys.forEach(function (key) {
                if (key === "city") {
                    values[key] = CachedWeather[CacheKey][0];
                } else if (key === "continent") {
                    values[key] = CachedWeather[CacheKey][1];
                } else if (key === "weather") {
                    values[key] = CachedWeather[CacheKey][2];
                } else if (key === "temperature") {
                    values[key] = CachedWeather[CacheKey][3];
                } else if (key === "humidity") {
                    values[key] = CachedWeather[CacheKey][4];
                } else if (key === "windSpeed") {
                    values[key] = CachedWeather[CacheKey][5];
                } else if (key === "windBearing") {
                    values[key] = CachedWeather[CacheKey][6];
                } else if (key === "pressure") {
                    values[key] = CachedWeather[CacheKey][7];
                } else if (key === "weatherIcon") {
                    values[key] = CachedWeather[CacheKey][8];
                } else if (key === "sunriseMinutesMidnight") {
                    values[key] = CachedWeather[CacheKey][9];
                } else if (key === "sunriseHour") {
                    values[key] = CachedWeather[CacheKey][10];
                } else if (key === "sunriseMinute") {
                    values[key] = CachedWeather[CacheKey][11];
                } else if (key === "sunriseMinutesSince") {
                    values[key] = CachedWeather[CacheKey][12];
                } else if (key === "sunsetMinutesMidnight") {
                    values[key] = CachedWeather[CacheKey][13];
                } else if (key === "sunsetHour") {
                    values[key] = CachedWeather[CacheKey][14];
                } else if (key === "sunsetMinute") {
                    values[key] = CachedWeather[CacheKey][15];
                } else if (key === "sunsetMinutesBefore") {
                    values[key] = CachedWeather[CacheKey][16];
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
                console.log( "Error occured when making http request. /n"+xhr.status + ': ' + xhr.statusText ); // example: 404: Not Found
            } else {
                if (xhr.responseText.substring(0,12) != '{"latitude":' && WeatherApiKey<(APIKeys.length-1)) {//TODO save CachedWeatherResponses immidiately!
                    WeatherApiKey++;                                                                                      //if API key gets blocked??
                    if (consoleOn) console.log("Changed API Key to key No "+(WeatherApiKey+1)+". ");
                    makeRequest()
                } else {
                    if (consoleOn) console.log(xhr.responseText);
                    data = JSON.parse(xhr.responseText);
                    j = 0;
                    if (data.currently==undefined||data.timezone==undefined||data.currently.summary==undefined||data.currently.windSpeed==undefined||
                        data.daily==undefined||data.daily.data[0]==undefined||data.currently.temperature==undefined||data.currently.humidity==undefined||
                        data.currently.windBearing==undefined||data.currently.pressure==undefined||data.currently.icon==undefined) {
                        if (WeatherApiKey<(APIKeys.length-1)) {
                            WeatherApiKey++;                                                                                      //if API key gets blocked??
                            if (consoleOn) {
                                console.log("Changed API Key to key No " + (WeatherApiKey + 1) + ". ");}
                        } else {//data cannot be retrieved
                            values="Error with request"
                            return values
                        }
                        makeRequest()
                    }
                    if (values!="Error with request") {
                        for (i = 0; i < data.timezone.length; i++) {
                            if (data.timezone.charAt(i) == '/') {
                                j = i;
                            }
                        }
                        var continent = data.timezone.substring(0, j);
                        var city = data.timezone.substring(j + 1);
                        var sunrise = sunTimeFeatures(data.daily.data[0].sunriseTime, data.currently.time, data.timezone);
                        var sunset = sunTimeFeatures(data.daily.data[0].sunsetTime, data.currently.time, data.timezone);

                        temp = [city, continent, data.currently.summary.replace(/\s+/g, ''),
                            ((data.currently.temperature - 32) / 1.8).toFixed(1), data.currently.humidity,
                            data.currently.windSpeed, data.currently.windBearing, data.currently.pressure, data.currently.icon,
                            sunrise.minutesSinceMidnight, sunrise.hour, sunrise.minute, sunrise.minutesSince,
                            sunset.minutesSinceMidnight, sunset.hour, sunset.minute, -sunset.minutesSince/* -minutesSince to get the time before*/];
                    }
                }
            }
            if (consoleOn)console.log("Weather API Called with key No "+(WeatherApiKey+1));
            if (values!="Error with request") CachedWeather[CacheKey] = temp;
            else  CachedWeather[pokeEntry.latitude+", "+ pokeEntry.longitude+", time:"+getTime(pokeEntry.appearedLocalTime)]="Bad request"
        });

        if (!CachedWeather[CacheKey]) {
            if (!CachedWeather[pokeEntry.latitude+", "+ pokeEntry.longitude+", time:"+getTime(pokeEntry.appearedLocalTime)])
                makeRequest(pokeEntry.latitude, pokeEntry.longitude, pokeEntry.appearedLocalTime); //TODO appearedOn or appearedlocaltime?
            else values="Error with request"
            if (values=="Error with request"){ //Error -> return empty respond and go on
                WeatherApiKey=0;
                if (showErrors) console.log("Bad server respond for entry: "+pokeEntry["_id"]+", returning empty data and proceeding with further entries.")
                saveOldWeather('json/CachedWeather.json', CachedWeather, consoleOn);//TODO here as well??
                return values
            }
            saveOldWeather('json/CachedWeather.json', CachedWeather, consoleOn);
        }
        else if (consoleOn) {console.log("Weather Api not called, loaded existing data");}
        returnResponse(keys, pokeEntry);//how? give the method nothing?
        return values;
    };





    /**time features relating to the sunrise and sunset time*/
    var sunTimeFeatures = (function (sunTimestamp, currentTimestamp, timezone) {
        var sunDate = moment.unix(sunTimestamp).tz(timezone);
        var currentDate = moment.unix(currentTimestamp).tz(timezone);
        return {
            "minutesSinceMidnight": minutesSinceMidnight(sunDate),
            "hour": sunDate.hours(),
            "minute": sunDate.minutes(),
            "minutesSince": minutesSinceMidnight(currentDate) - minutesSinceMidnight(sunDate)
        };
    });
    var minutesSinceMidnight = (function (momentDate) {
        return momentDate.hours()*60 + momentDate.minutes()
    });
    var getS2Cell = (function(latitude, longitude){
        var key = S2.latLngToKey(latitude, longitude, 11);
        return S2.keyToId(key);
    })
    var getTime = (function(data){// 12 parts je 2 hours
        var date = new Date(data);
        return (date.getFullYear()+"-"+date.getMonth()+"-"+date.getDay()+"-dayPart:"+(date.getHours()/2).toFixed(0));
    });
})('undefined' !== typeof module ? module.exports : window);
