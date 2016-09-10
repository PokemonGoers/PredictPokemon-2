var forecast = require('forecast.io')
APIKeys = ['4e9bb2e33940272eeea09e0210886de0']
options = { APIKey: APIKeys[0]  }   //here possible to implement switching between keys, if more than 1000 requests/day are done. counter in parent "class" needed (to switch after, say, 950 requests)
Forecast = new forecast(options);   //init API with API key


respond = require('../dataSet_creator.js').respond  // how to import???                       !???!



(function (exports) {
    var module = exports.module = {};
    module.getFeatures = function (keys, pokeEntry) {
        var values = {}
        keys.forEach(function (key) {

//List check! - if this value is in the list, then just read and return it; if not - calculate such
            if (respond===undefined  || respond[pokeEntry["_id"]] === undefined) {
                var date = new Date(pokeEntry.appearedLocalTime)
                Forecast.getAtTime(pokeEntry.latitude, pokeEntry.longitude, Math.round(date.getTime() / 1000), function (err, res, data) {//    lat/long switched
                    if (err) throw err;
                    respond[pokeEntry[_id]] = [data.timezone, data.currently.summary, data.currently.precipType, ((data.currently.temperature - 32) / 1.8).toFixed(1),
                        data.currently.humidity, data.currently.windSpeed, data.currently.windBearing, data.currently.pressure]
                });
            }

            if (key === "timezone") {
                values[key]= respond[0];
            } else if (key === "weather") {
                values[key]= respond[1]
            } else if (key === "precipType") {
                values[key]= respond[2]
            } else if (key === "temperature") {
                values[key]= respond[3]
            } else if (key === "humidity") {
                values[key]= respond[4]
            } else if (key === "windSpeed") {
                values[key]= respond[5]
            } else if (key === "windBearing") {
                values[key]= respond[6]
            } else if (key === "pressure") {
                values[key]= respond[7]
            }
        })
        return values
    }
})('undefined' !== typeof module ? module.exports : window);
