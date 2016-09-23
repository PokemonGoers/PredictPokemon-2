var APIKeys = ['4e9bb2e33940272eeea09e0210886de0']//api keys will be stored here//'49b8958cdb735261a244a5cb0edbf9a7','57e3c5edfc29d014491232d0ffb99aa0'
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest;
var moment = require('moment-timezone');
var S2 = require('s2-geometry').S2;
var util = require('util')
var consoleOn = false;     //turns on/off console output
var showErrors = true;
var values;
var temp = "emptyyet";
var saveBad = false;       //save bad request answers not to repeat them. by default true
var saveGood = true;       //by default true
var showSaveMessage = false;
var reparseMsg = true;
var showWhenNotCalled = true;//shows when API not called and cached data retrieved
        //TODO ////////////////// What's with returned time? currentTime = local, forecast - UTC???//////////// odd

(function (exports) {
    var module = exports.module = {};
    var APIkey = WeatherApiKey;
    var S2Level =          10;  //10 by def. 10.level is about 10*10km, 8 is about 48*48km, 23 is 1.4*1.4m(meters!)
    var TimeFrameDividor = 2;   //2 by def. Divides 24h of the day by that number to get part of the day (timeFrame)
    module.getFeatures = function (keys, pokeEntry) {
        var missing = [];
        values = {};
        var readBadRequest = false;
        //S2_cell: level 10, time: 12 parts of the day
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
            var URL = 'https://api.darksky.net/forecast/'+APIKeys[APIkey]+'/'+pokeEntry.latitude+','+pokeEntry.longitude+','+timestamp+''
            xhr.open('GET', URL, false);
            xhr.timeout=1500;
            xhr.onTimeout = function(){                                   //TODO make timeout resend
                xhr.responseText="Timeout"
            }
            xhr.send();
            if (xhr.status != 200) {
                console.log( "Error occured when making http request. \n"+xhr.status + ': ' + xhr.statusText ); // example: 404: Not Found
            } else {
                /*if (xhr.responseText.substring(0,12) != '{"latitude":' && WeatherApiKey<(APIKeys.length-1)) {//TODO timeout reaction here
                    WeatherApiKey++;                                                                                      //if API key gets blocked??
                    if (consoleOn) console.log("Changed API Key to key No "+(WeatherApiKey+1)+". ");
                    makeRequest()
                } else */ {
                    if (consoleOn) console.log(xhr.responseText);
                    var data = JSON.parse(xhr.responseText);
                    if (data.currently!=undefined&&data.timezone!=undefined&&data.currently.summary==undefined&&data.currently.windSpeed==undefined&&
                        data.daily==undefined&&data.currently.temperature==undefined&&data.currently.humidity==undefined&&
                        data.currently.windBearing==undefined&&data.currently.pressure==undefined&&data.currently.icon==undefined){
                        if (APIkey<(APIKeys.length-1)) {
                            APIkey++;                                                                                      //if API key gets blocked??
                            console.log("Changed API Key to key No " + (APIkey + 1) + ". ");
                            makeRequest()
                        } else {
                            values="Error with request";
                            return values;
                        }
                    } /*else console.log(data.currently!=undefined+", "+data.timezone!=undefined+", "+data.currently.summary==undefined+", "+data.currently.windSpeed&&undefined+", "+
                        data.daily==undefined+", "+data.currently.temperature==undefined+", "+data.currently.humidity==undefined+", "+
                        data.currently.windBearing==undefined+", "+data.currently.pressure==undefined+", "+data.currently.icon==undefined)*/


                    if (data.currently==undefined||data.timezone==undefined||data.currently.summary==undefined||data.currently.windSpeed==undefined||
                        data.daily==undefined||data.daily.data[0]==undefined||data.currently.temperature==undefined||data.currently.humidity==undefined||
                        data.currently.windBearing==undefined||data.currently.pressure==undefined||data.currently.icon==undefined) {
                        missing = [];
                        if (data.timezone == undefined) missing.push("timezone");
                        if (data.currently == undefined) missing.push("currently");
                        else {
                            if (data.currently.summary == undefined) missing.push("currently.summary");
                            if (data.currently.windSpeed == undefined) missing.push("currently.windSpeed");
                            if (data.currently.temperature == undefined) missing.push("temperature");
                            if (data.currently.humidity == undefined) missing.push("currently.humidity");
                            if (data.currently.windBearing == undefined) missing.push("currently.windBearing");
                            if (data.currently.pressure == undefined) missing.push("currently.pressure");
                            if (data.currently.icon == undefined) missing.push("currently.icon");
                        }
                        if (data.daily==undefined) missing.push("daily");
                        else if (data.daily.data[0]==undefined) missing.push("daily.data");

                        var tempData=tryToReparseXMLRespond(data, missing);
                        if (tempData!=false) {
                            if (reparseMsg) console.log("Reparsed data for " + missing + " successfully.")
                            data = tempData;
                            values = "gotReplacementData"
                        } else {
                            values="Error with request";
                        }
                    }
                    parseXMLRespond(data);
                    //saveOldWeather('json/GoodRespond.json', data, true);//for debugging, to save a good object;
                }
            }
            if (consoleOn)console.log("Weather API Called with key No "+(APIkey+1));
            if (values!="Error with request") CachedWeather[CacheKey] = temp;
            else  if (saveBad) {
                CachedWeather[pokeEntry.latitude+", "+ pokeEntry.longitude+", time:"+getTime(pokeEntry.appearedLocalTime)]="Bad respond"
                BadServerResponds[pokeEntry.latitude+", "+ pokeEntry.longitude+", time:"+getTime(pokeEntry.appearedLocalTime)]=data;
            }
        });

        if (!CachedWeather[CacheKey]) {
            if (!CachedWeather[pokeEntry.latitude+", "+ pokeEntry.longitude+", time:"+getTime(pokeEntry.appearedLocalTime)]){
                makeRequest(pokeEntry.latitude, pokeEntry.longitude, pokeEntry.appearedLocalTime); //TODO appearedOn or appearedlocaltime?
            } else {
                readBadRequest = true
                values = "Error with request"
                if (showWhenNotCalled) console.log("Weather Api not called, loaded existing (bad) data")
            }
            if (values=="Error with request"){ //Error -> return empty respond and go on
                APIkey=WeatherApiKey;
                if (showErrors&&(readBadRequest==false)) console.log("Bad server respond for entry: "+pokeEntry["_id"]+", failed to reparse bad respond, "+missing+" is missing.")
                if (saveBad&&(readBadRequest==false)){
                    //saveOldWeather('json/BadResponds.json', BadServerResponds, showSaveMessage);
                    if (saveGood)saveOldWeather('json/CachedWeather.json', CachedWeather, showSaveMessage);
                }
                return values
            }
            else if (saveGood)saveOldWeather('json/CachedWeather.json', CachedWeather, showSaveMessage);
        }
        else if (showWhenNotCalled) {console.log("Weather Api not called, loaded existing data");}
        returnResponse(keys, pokeEntry);//how? give the method nothing?
        if (saveGood==false) CachedWeather={"":""}
        return values;
    };



    var parseXMLRespond = (function(data){
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
    });
    /**Try to find missing data in yet unused text from xhr.responseText*/
    var tryToReparseXMLRespond = (function (data, missing){
        var error = false;
        var summary, temperature, humidity, windSpeed, windBearing, pressure, icon, sunrise, sunset;
        missing.forEach(function(missed){
            switch(missed){
                case "timezone":{
                    error = true;
                    return false;//nowhere else to get data from
                }
                case "daily":{
                    error = true;
                    return false;//same
                }
                case "daily.data":{
                    error = true;
                    return false;//same
                }
                case "currently":{
                    //for summary
                    {
                        if (data.hourly&&data.hourly.data) {
                            for (var i = 0; i < data.hourly.data.length; i++) {
                                if (data.hourly.data[i].summary)
                                    summary = data.hourly.data[i].summary;
                            }
                        }
                        if (summary==undefined) {
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].summary)
                                summary = data.daily.data[0].summary
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.summary=summary;
                    }
                    //for temperature
                    {
                        if (data.hourly&&data.hourly.data) {
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
                        data.currently.temperature=temperature;
                    }
                    //for humidity
                    {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].humidity) {
                                    humidity = data.hourly.data[i].humidity;
                                    break;
                                }
                            }
                        }
                        if (humidity == undefined) {
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].humidity)
                                humidity = data.daily.data[0].humidity;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.humidity=humidity;
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
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].windSpeed)
                                windSpeed = data.daily.data[0].windSpeed;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.windSpeed=windSpeed;
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
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].windBearing)
                                windBearing = data.daily.data[0].windBearing;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.windBearing=windBearing;
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
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].pressure)
                                pressure = data.daily.data[0].pressure;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.pressure=pressure;
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
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].icon)
                                icon = data.daily.data[0].icon;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.icon=icon;
                    }
                }
                ///////////////////
                case "currently.summary":{
                    if (summary==undefined){
                        if (data.hourly&&data.hourly.data) {
                            for (var i = 0; i < data.hourly.data.length; i++) {
                                if (data.hourly.data[i].summary) {
                                    summary = data.hourly.data[i].summary;
                                    break;
                                }
                            }
                        }
                        if (summary==undefined) {
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].summary)
                                summary = data.daily.data[0].summary
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.summary=summary;
                    }
                }
                case "currently.windSpeed":{
                    if (windSpeed==undefined){
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].windSpeed) {
                                    windSpeed = data.hourly.data[i].windSpeed;
                                    break;
                                }
                            }
                        }
                        if (windSpeed == undefined) {
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].windSpeed)
                                windSpeed = data.daily.data[0].windSpeed;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.windSpeed=windSpeed;
                    }
                }
                case "currently.windBearing":{
                    if (windBearing==undefined){
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].windBearing) {
                                    windBearing = data.hourly.data[i].windBearing;
                                    break;
                                }
                            }
                        }
                        if (windBearing == undefined) {
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].windBearing)
                                windBearing = data.daily.data[0].windBearing;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.windBearing=windBearing;
                    }
                }
                case "temperature":{
                    if (temperature==undefined){
                        if (data.hourly&&data.hourly.data) {
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
                        data.currently.temperature=temperature;
                    }
                }
                case "currently.humidity":{
                    if (humidity==undefined){
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].humidity) {
                                    humidity = data.hourly.data[i].humidity;
                                    break;
                                }
                            }
                        }
                        if (humidity == undefined) {
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].humidity)
                                humidity = data.daily.data[0].humidity;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.humidity=humidity;
                    }
                }
                case "currently.pressure":{
                    if (pressure==undefined) {
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].pressure) {
                                    pressure = data.hourly.data[i].pressure;
                                    break;
                                }
                            }
                        }
                        if (pressure == undefined) {
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].pressure)
                                pressure = data.daily.data[0].pressure;
                            else {
                                error = true;
                                return false;
                            }
                        }
                    }
                    data.currently.pressure=pressure;
                }
                case "currently.icon":{
                    if (icon==undefined){
                        if (data.hourly && data.hourly.data) {
                            for (var i = 0; i < data.hourly.length; i++) {
                                if (data.hourly.data[i].icon) {
                                    icon = data.hourly.data[i].icon;
                                    break;
                                }
                            }
                        }
                        if (icon == undefined) {
                            if (data.daily&&data.daily.data&&data.daily.data[0]&&data.daily.data[0].icon)
                                icon = data.daily.data[0].icon;
                            else {
                                error = true;
                                return false;
                            }
                        }
                        data.currently.icon=icon;
                    }
                }
            }
        })
        if (error) return false;
        return data;//return true later
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
        return momentDate.hours()*60 + momentDate.minutes()
    });
    var getS2Cell = (function(latitude, longitude){
        var key = S2.latLngToKey(latitude, longitude, S2Level);
        return S2.keyToId(key);
    })
    var getTime = (function(data){// 12 parts je 2 hours
        var date = new Date(data);
        return (date.getFullYear()+"-"+date.getMonth()+"-"+date.getDay()+"-dayPart:"+(date.getHours()/TimeFrameDividor).toFixed(0));
    });
})('undefined' !== typeof module ? module.exports : window);
