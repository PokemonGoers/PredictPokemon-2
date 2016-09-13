//var weatherApi = require('weather-api')
//var weatherCheck = require('weather-check')
//var wwo = require('worldweatheronline-api')
var util= require('util');
var moment = require('moment-timezone');
var forecast = require('forecast.io');
var latitude = 151.207102;
var longitude = -33.859318;
var appearedOn = 1472802777000;
var options = {
    APIKey: '4e9bb2e33940272eeea09e0210886de0',
    //APIKey: process.env.FORECAST_API_KEY
};
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

    // summary: A human-readable text summary of this data point. (Do not use this value for automated purposes: you should use the icon property, instead.)
    // icon: A machine-readable text summary of this data point, suitable for selecting an icon for display. If defined, this property will have one of the following values: clear-day, clear-night, rain, snow, sleet, wind, fog, cloudy, partly-cloudy-day, or partly-cloudy-night. (Developers should ensure that a sensible default is defined, as additional values, such as hail, thunderstorm, or tornado, may be defined in the future.)
    console.log('Icon: '+data.currently.icon); //machine read
    console.log('sunrise: '+data.daily.data[0].sunriseTime);
    console.log('sunset: '+data.daily.data[0].sunsetTime);

    var sunrise = moment.unix(data.daily.data[0].sunriseTime).tz(data.timezone);

    console.log('time:' + data.currently.time + ', tz: ' + data.timezone + ' -> ' + moment(data.currently.time*1000).tz(data.timezone).format());

});