//var weatherApi = require('weather-api')
//var weatherCheck = require('weather-check')
//var wwo = require('worldweatheronline-api')
var util= require('util');
var forecast = require('forecast.io')
var latitude = 151.207102
var longitude = -33.859318
var appearedOn = 1472802777000
var options = {
    APIKey: '4e9bb2e33940272eeea09e0210886de0',
    //APIKey: process.env.FORECAST_API_KEY
}
Forecast = new forecast(options);

Forecast.getAtTime(longitude, latitude, Math.round(appearedOn/1000),function(err,res,data){
    if(err) throw err;
    //console.log(util.inspect(data));

    console.log('Latitude: '+data.latitude);
    console.log('Longitude: '+data.longitude);
    console.log('Timezone: '+data.timezone);
    console.log('Weather: '+data.currently.summary);
    //console.log(data.currently.precipType);
    console.log('Temperature: '+((data.currently.temperature-32)/1.8).toFixed(1));
    console.log('Humidity: '+data.currently.humidity);
    console.log('Speed of wind: '+data.currently.windSpeed);
    console.log('Wind bearing: '+data.currently.windBearing);
    console.log('Pressure: '+data.currently.pressure);
});
