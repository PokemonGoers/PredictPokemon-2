var APIKeys = [
    '49b8958cdb735261a244a5cb0edbf9a7',
    '57e3c5edfc29d014491232d0ffb99aa0',
    '4e9bb2e33940272eeea09e0210886de0']//api keys stored here//
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest;
var moment = require('moment-timezone');
var S2 = require('s2-geometry').S2;
var util = require('util')
var consoleOn = false;          //turns on/off console output
var showSaveMessage = false;    //show msg when weather is being saved to external file
var showErrors = true;         //obvious
var showReparseMsg = false;     //show msg when corrupt respond was being reparsed
var showWhenNotCalled = false;  //shows when API not called and cached data retrieved
var saveBad = true;             //save bad request answers not to repeat them. by default true
var saveGood = true;            //by default true
var switchKeys = false;         //turns on/off switching keys after 1000 requests
var values;
var temp = "emptyyet";

(function (exports) {
    var module = exports.module = {};
    var APIkey = WeatherApiKey;
    var S2Level = 9;  //10 by def. 10.level is about 10*10km, 9 is 23*23km, 8 is 46*46km, 23 is 1.4*1.4m(meters!)
    var TimeFrameDividor = 3;   //2 by def. Divides 24h of the day by that number to get part of the day (timeFrame)
    module.getFeatures = function (keys, pokeEntry) {
        var missing = [];
        values = {};
        var readBadRequest = false;
        //S2_cell: level 10, time: 12 parts of the day
        var CacheKey = "S2_cell: " + getS2Cell(pokeEntry.latitude, pokeEntry.longitude) + ", time:" + getTime(pokeEntry.appearedLocalTime);

        var returnResponse = (function (keys) {
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
                } else if (key === "windSpeed") {
                    values[key] = CachedWeather[CacheKey][4];
                } else if (key === "windBearing") {
                    values[key] = CachedWeather[CacheKey][5];
                } else if (key === "pressure") {
                    values[key] = CachedWeather[CacheKey][6];
                } else if (key === "weatherIcon") {
                    values[key] = CachedWeather[CacheKey][7];
                } else if (key === "sunriseMinutesMidnight") {
                    values[key] = CachedWeather[CacheKey][8];
                } else if (key === "sunriseHour") {
                    values[key] = CachedWeather[CacheKey][9];
                } else if (key === "sunriseMinute") {
                    values[key] = CachedWeather[CacheKey][10];
                } else if (key === "sunriseMinutesSince") {
                    values[key] = CachedWeather[CacheKey][11];
                } else if (key === "sunsetMinutesMidnight") {
                    values[key] = CachedWeather[CacheKey][12];
                } else if (key === "sunsetHour") {
                    values[key] = CachedWeather[CacheKey][13];
                } else if (key === "sunsetMinute") {
                    values[key] = CachedWeather[CacheKey][14];
                } else if (key === "sunsetMinutesBefore") {
                    values[key] = CachedWeather[CacheKey][15];
                }
            })
        });

        var makeRequest = (function () {
            var date = new Date(pokeEntry.appearedLocalTime);
            var timestamp = Math.round(date.getTime() / 1000);
            //switching between API Keys here
            if (switchKeys) {
                WeatherApiKeyCounter++;
                if (WeatherApiKeyCounter > 1000) {
                    WeatherApiKey++;
                    if (WeatherApiKey < (APIKeys.length - 1)) { //if there is still unused key
                        WeatherApiKeyCounter = 0;
                    }
                    else {                                  //if there is not, point on unexisting key
                        showErrors = true;//so that you see when it happens
                    }
                }
            }
            var URL = 'https://api.darksky.net/forecast/' + APIKeys[APIkey] + '/' + pokeEntry.latitude + ',' + pokeEntry.longitude + ',' + timestamp + ''
            xhr.open('GET', URL, false);
            xhr.timeout = 1500;
            xhr.onTimeout = function () {
                xhr.responseText = "Timeout"
                xhr.send()
            }
            xhr.send();
            if (xhr.status != 200) {
                console.log("Error occured when making http request. \n" + xhr.status + ': ' + xhr.statusText); // example: 404: Not Found
            } else {
                if (xhr.responseText.substring(0, 12) != '{"latitude":' && WeatherApiKey < (APIKeys.length - 1)) { //if API key gets blocked??
                    WeatherApiKey++;
                    if (consoleOn) console.log("Changed API Key to key No " + (WeatherApiKey + 1) + ". ");
                    makeRequest()
                } else {
                    if (consoleOn) console.log(xhr.responseText);
                    var data = JSON.parse(xhr.responseText);
                    if (data.currently != undefined && data.timezone != undefined && data.currently.summary == undefined &&
                        data.currently.windSpeed == undefined && data.daily == undefined && data.currently.temperature == undefined &&
                        data.currently.windBearing == undefined && data.currently.pressure == undefined && data.currently.icon == undefined) {
                        if (showErrors) {
                            console.log("Respond from weather server contains no weather")
                        }
                        values = "Error with request";
                        missing.push("everything");
                        return values;
                    }
                    if (data.currently == undefined || data.timezone == undefined || data.currently.summary == undefined || data.currently.windSpeed == undefined ||
                        data.daily == undefined || data.daily.data[0] == undefined || data.currently.temperature == undefined ||
                        data.currently.windBearing == undefined || data.currently.pressure == undefined || data.currently.icon == undefined) {
                        missing = [];
                        if (data.timezone == undefined) missing.push("timezone");
                        if (data.currently == undefined) missing.push("currently");
                        else {
                            if (data.currently.summary == undefined) missing.push("summary");
                            if (data.currently.windSpeed == undefined) missing.push("windSpeed");
                            if (data.currently.temperature == undefined) missing.push("temperature");
                            if (data.currently.windBearing == undefined) missing.push("windBearing");
                            if (data.currently.pressure == undefined) missing.push("pressure");
                            if (data.currently.icon == undefined) missing.push("icon");
                        }
                        if (data.daily == undefined) missing.push("daily");
                        else if (data.daily.data[0] == undefined) missing.push("daily.data");

                        var tempData = tryToReparseXMLRespond(data, missing);
                        if (tempData != false) {
                            if (showReparseMsg) console.log("Reparsed data for " + missing + " successfully.")
                            data = tempData;
                            values = "gotReplacementData"
                        } else {
                            values = "Error with request";
                            //saveOldWeather('json/BadRespond.json', data, true);//fur debugging
                            return values;
                        }
                    }
                    parseXMLRespond(data);
                    //saveOldWeather('json/GoodRespond.json', data, true);//for debugging, to save a good object;
                }
            }
            if (consoleOn)console.log("Weather API Called with key No " + (APIkey + 1));
            if (values != "Error with request") {
                CachedWeather[CacheKey] = temp;
            }
        });

        if (!CachedWeather[CacheKey]) {
            if (!CachedWeather[pokeEntry.latitude + ", " + pokeEntry.longitude + ", time:" + getTime(pokeEntry.appearedLocalTime)]) {
                makeRequest(pokeEntry.latitude, pokeEntry.longitude, pokeEntry.appearedLocalTime);
            } else {
                readBadRequest = true
                values = "Error with request"
                if (showWhenNotCalled) console.log("Weather Api not called, loaded existing (bad) data")
            }
            if (values == "Error with request" && saveBad) {
                CachedWeather[pokeEntry.latitude + ", " + pokeEntry.longitude + ", time:" + getTime(pokeEntry.appearedLocalTime)] = "Bad respond, " +
                    missing + " is missing."
            }
            if (values == "Error with request") { //Error -> return empty respond and go on
                APIkey = WeatherApiKey;
                if (readBadRequest == false) {
                    if (showErrors) {
                        console.log("Bad server respond for entry: " + pokeEntry["_id"] + ", failed to reparse bad respond, " + missing + " is missing.")
                    }
                    if (saveBad) {
                        saveOldWeather(__dirname + '/../json/CachedWeather.json', CachedWeather, showSaveMessage);
                    }
                }
                return values
            }
            else if (saveGood)saveOldWeather(__dirname + '/../json/CachedWeather.json', CachedWeather, showSaveMessage);
        }
        else if (showWhenNotCalled) {
            console.log("Weather Api not called, loaded existing data");
        }
        returnResponse(keys);//how? give the method nothing?
        if (saveGood == false) CachedWeather = {"": ""}
        return values;
    };


    var parseXMLRespond = (function (data) {
        if (values != "Error with request") {
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
                ((data.currently.temperature - 32) / 1.8).toFixed(1),
                data.currently.windSpeed, data.currently.windBearing, data.currently.pressure, data.currently.icon,
                sunrise.minutesSinceMidnight, sunrise.hour, sunrise.minute, sunrise.minutesSince,
                sunset.minutesSinceMidnight, sunset.hour, sunset.minute, -sunset.minutesSince/* -minutesSince to get the time before*/];
        }
    });
    /**Try to find missing data in yet unused text from xhr.responseText*/
    var tryToReparseXMLRespond = (function (data, missing) {
        var error = false;
        var summary, temperature, windSpeed, windBearing, pressure, icon;
        missing.forEach(function (missed) {
            switch (missed) {
                case "timezone": {
                    error = true;
                    return false;//nowhere else to get data from
                }
                case "daily": {
                    error = true;
                    return false;//same
                }
                case "daily.data": {
                    error = true;
                    return false;//same
                }
                case "currently": {
                    //for summary
                    {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.data.length; i++) {
                                if (data.hourly.data[i].summary)
                                    summary = data.hourly.data[i].summary;
                            }
                        }
                        if (summary == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].summary)
                                summary = data.daily.data[0].summary
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.summary = summary;
                    }
                    //for temperature
                    {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.data.length; i++) {
                                if (data.hourly.data[i].temperature)
                                    temperature = data.hourly.data[i].temperature;
                            }
                        }
                        if (temperature == undefined) {//data.hourly.data is missing as well or was empty
                            if (data.daily && data.daily.data && data.daily.data.temperature) {
                                temperature = daily.data.temperature;
                            } else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.temperature = temperature;
                    }
                    //for windSpeed
                    {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].windSpeed) {
                                    windSpeed = data.hourly.data[i].windSpeed;
                                    break;
                                }
                            }
                        }
                        if (windSpeed == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].windSpeed)
                                windSpeed = data.daily.data[0].windSpeed;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.windSpeed = windSpeed;
                    }
                    //for windBearing
                    {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].windBearing) {
                                    windBearing = data.hourly.data[i].windBearing;
                                    break;
                                }
                            }
                        }
                        if (windBearing == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].windBearing)
                                windBearing = data.daily.data[0].windBearing;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.windBearing = windBearing;
                    }
                    //for pressure
                    {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].pressure) {
                                    pressure = data.hourly.data[i].pressure;
                                    break;
                                }
                            }
                        }
                        if (pressure == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].pressure)
                                pressure = data.daily.data[0].pressure;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.pressure = pressure;
                    }
                    //for icon
                    {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].icon) {
                                    icon = data.hourly.data[i].icon;
                                    break;
                                }
                            }
                        }
                        if (icon == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].icon)
                                icon = data.daily.data[0].icon;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.icon = icon;
                    }
                }
                ///////////////////
                case "summary": {
                    if (summary == undefined) {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.data.length; i++) {
                                if (data.hourly.data[i].summary) {
                                    summary = data.hourly.data[i].summary;
                                    break;
                                }
                            }
                        }
                        if (summary == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].summary)
                                summary = data.daily.data[0].summary
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.summary = summary;
                    }
                }
                case "windSpeed": {
                    if (windSpeed == undefined) {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].windSpeed) {
                                    windSpeed = data.hourly.data[i].windSpeed;
                                    break;
                                }
                            }
                        }
                        if (windSpeed == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].windSpeed)
                                windSpeed = data.daily.data[0].windSpeed;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.windSpeed = windSpeed;
                    }
                }
                case "windBearing": {
                    if (windBearing == undefined) {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].windBearing) {
                                    windBearing = data.hourly.data[i].windBearing;
                                    break;
                                }
                            }
                        }
                        if (windBearing == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].windBearing)
                                windBearing = data.daily.data[0].windBearing;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.windBearing = windBearing;
                    }
                }
                case "temperature": {
                    if (temperature == undefined) {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.data.length; i++) {
                                if (data.hourly.data[i].temperature) {
                                    temperature = data.hourly.data[i].temperature;
                                    break;
                                }
                            }
                        }
                        if (temperature == undefined) {//data.hourly.data is missing as well or was empty
                            if (data.daily && data.daily.data && data.daily.data.temperature) {
                                temperature = daily.data.temperature;
                            } else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.temperature = temperature;
                    }
                }
                case "pressure": {
                    if (pressure == undefined) {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].pressure) {
                                    pressure = data.hourly.data[i].pressure;
                                    break;
                                }
                            }
                        }
                        if (pressure == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].pressure)
                                pressure = data.daily.data[0].pressure;
                            else {
                                error = true;
                                return false;
                            }
                        }
                    }
                    data.currently.pressure = pressure;
                }
                case "icon": {
                    if (icon == undefined) {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].icon) {
                                    icon = data.hourly.data[i].icon;
                                    break;
                                }
                            }
                        }
                        if (icon == undefined) {
                            if (data.daily && data.daily.data && data.daily.data[0] && data.daily.data[0].icon)
                                icon = data.daily.data[0].icon;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.icon = icon;
                    }
                }
            }
        })
        if (error) return false;
        return data;
    });
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
        return momentDate.hours() * 60 + momentDate.minutes()
    });
    var getS2Cell = (function (latitude, longitude) {
        var key = S2.latLngToKey(latitude, longitude, S2Level);
        return S2.keyToId(key);
    })

    function getTime(time) {
        var newDate = new Date(time);
        return (newDate.getFullYear() + "-" + (newDate.getMonth() + 1) + "-" + newDate.getDate() + "-dayPart:" +
        (newDate.getUTCHours() / TimeFrameDividor).toFixed(0));
    }//TODO find out why I have to use (newDate.getMonth()+1) for month to be right
})('undefined' !== typeof module ? module.exports : window);
