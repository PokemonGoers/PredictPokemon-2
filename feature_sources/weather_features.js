(function (exports) {
    var module = exports.module = {};
    var forecast = require('forecast.io');
    APIKeys = ['4e9bb2e33940272eeea09e0210886de0'];
    var options = { APIKey: APIKeys[0] };       //here possible to implement switching between keys, if more than 1000 requests/day are done. counter in parent "class" needed (to switch after, say, 950 requests)
    Forecast = new forecast(options);           //init API with API key

    /**
     * Get the feature value for the specified key by using the data of the pokeEntry,
     * which represents the JSON object which is returned from the API for a Pokemon sighting.
     * @param keys array of keys which refer to the name of features. The keys are read out from the feature_config.json
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     * @returns the values for the specified features by considering the given data.
     */
    module.getFeatures = function (keys, pokeEntry) {
        var values = {};
        var date = new Date(pokeEntry.appearedLocalTime);
        Forecast.getAtTime(pokeEntry.latitude, pokeEntry.longitude, Math.round( date.getTime()/ 1000), function (err, res, data) {//    lat/long switched
            if (err) throw err;
            if (data.error) {
                console.log('Error: '  + data.error + ', code: ' + data.code);
                throw data.error;
            }
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

            keys.forEach(function (key) {
                if (key === "timezone") {
                    values[key] = data.timezone;
                }
                else if (key === "weather") {
                    values[key] = data.currently.summary;
                }
                else if (key === "precipType") {
                    values[key] = data.currently.precipType;
                }
                else if (key === "temperature") {
                    values[key] = ((data.currently.temperature - 32) / 1.8).toFixed(1);
                }
                else if (key === "humidity") {
                    values[key] = data.currently.humidity;
                }
                else if (key === "windSpeed") {
                    values[key] = data.currently.windSpeed;
                }
                else if (key === "windBearing") {
                    values[key] = data.currently.windBearing;
                }
                else if (key === "pressure") {
                    values[key] = data.currently.pressure;
                }
                else {
                    console.log("The key " + key + " is not in the raw API data.");
                    throw "UnknownFeatureKey";
                }
            });
        });

        return values;
        // example: Timezone: Australia/Sydney, data.currently.summary: Partly Rain, data.currently.precipType: Rain,
        // Temperature in Celsius, Humidity: 0.88, Speed of wind: 12.82, Wind bearing: 357, Pressure: 995.57
    }
})('undefined' !== typeof module ? module.exports : window);
