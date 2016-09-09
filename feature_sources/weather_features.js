(function (exports) {
    var module = exports.module = {};
    var forecast = require('forecast.io')
    APIKeys = ['4e9bb2e33940272eeea09e0210886de0']
    var options = { APIKey: APIKeys[0]  }//here possible to implement switching between keys, if more than 1000 requests/day are done. counter in parent "class" needed (to switch after, say, 950 requests)
    Forecast = new forecast(options);//init API with API key

    module.getFeature = function (key, pokeEntry) {
        if (key === "weather") {
            var date = new Date(pokeEntry.appearedLocalTime)
            Forecast.getAtTime(pokeEntry.longitude, pokeEntry.latitude, Math.round( date.getTime()/ 1000), function (err, res, data) {//    lat/long switched
                if (err) throw err;
                /*console.log(util.inspect(data));   //for testing - possible returns
                console.log('Latitude: ' + data.latitude);
                console.log('Longitude: ' + data.longitude);
                console.log('Timezone: ' + data.timezone);
                console.log('Weather: ' + data.currently.summary);
                console.log(data.currently.precipType);
                console.log('Temperature: ' + ((data.currently.temperature - 32) / 1.8).toFixed(1));
                console.log('Humidity: ' + data.currently.humidity);
                console.log('Speed of wind: ' + data.currently.windSpeed);
                console.log('Wind bearing: ' + data.currently.windBearing);
                console.log('Pressure: ' + data.currently.pressure);*/
                respond = [data.timezone, data.currently.summary,data.currently.precipType,((data.currently.temperature - 32) / 1.8).toFixed(1),
                    data.currently.humidity,data.currently.windSpeed,data.currently.windBearing,data.currently.pressure]
                return respond; //example: Timezone: Australia/Sydney, data.currently.summary: Partly Rain, data.currently.precipType: Rain, Temperature in Celsius,
            });                 //Humidity: 0.88, Speed of wind: 12.82, Wind bearing: 357, Pressure: 995.57
        }
    }
})('undefined' !== typeof module ? module.exports : window);
