/**
 * Created by matt on 05.09.16.
 */

/*
* This script takes data (source.json) and extracts more features from the information.
* The output is another json file (output.json).
* The extracted features are:
* 1. Location
* 1.1. Latitude (already inserted)
* 1.2. Longitude (already inserted)
* (1.3. S2 box ID) -> see @bensLine implementation
*
* 2. Timestamp
* 2.1. Day of the Week
* 2.2. Day
* 2.3. Month
* 2.4. Year
* 2.5. Hour
* 2.6. Minute
* 2.7. Time of day (Night, Morning, Afternoon, Evening)
*
* This file could be used as base for more exractins later on, hence the modular structure.
* */

var fs = require('fs');

//source and output file
var source = 'source.json';
var output = 'output.json';

var data = JSON.parse(source);
switchLatitudeLongitude(data);
tolocaltime(data);
addDayMonthYear(data);
addHourMinute(data);
addTimeOfDay(data);


/*
 This function adds the time of the day:
 20:00 - 07:00 : Night
 07:00 - 12:00 : Morning
 12:00 - 16:00 : Afternoon
 16:00 - 20:00 : Evening

 We still have to consider changing these to equidistant intervals.

 Expects the date/time in variable appearedOn.
 */
function addTimeOfDay(_data) {
    _data.forEach(function (element) {
        var hour = element.appearedOn.getHours();
        if(20<=hour && hour<24){
            element.appearedTimeOfDay = 'night';
        } else if (0<=hour && hour<7){
            element.appearedTimeOfDay = 'night';
        } else if (7<=hour && hour<12){
            element.appearedTimeOfDay = 'morning';
        } else if (12<=hour && hour<16){
            element.appearedTimeOfDay = 'afternoon';
        } else if (16<=hour && hour<20){
            element.appearedTimeOfDay = 'evening';
        }
    });
}


/*
 This function splits the time into two pieces: appearedHour appearedMinute.
 Expects the date/time in variable appearedOn.
 */
function addHourMinute(_data) {
    _data.forEach(function (element) {
        element.appearedHour = element.appearedOn.getHours();
        element.appearedMinute = element.appearedOn.getMinutes();
    });
}

/*
 This function splits the date into four pieces: appearedDayOfWeek appearedDay appearedMonth appearedYear.
 Expects the date/time in variable appearedOn.
 */
function addDayMonthYear(_data) {
    _data.forEach(function (element) {
        element.appearedDayOfWeek = element.appearedOn.getDay();
        element.appearedDay = element.appearedOn.getDate();
        element.appearedMonth = element.appearedOn.getMonth();
        element.appearedYear = element.appearedOn.getFullYear();
    });
}

/*
 At the moment the format of the data is Lon/Lat. This function switches them.
 Expects the coordinates in variable location.coordinates[0] and location.coordinates[1]
 May have to remove this if data team changes format.
 */
function switchLatitudeLongitude(_data) {
    _data.forEach(function (element) {
        var tmp = parseFloat(element.location.coordinates[0]);
        element.location.coordinates[0] = element.location.coordinates[1];
        element.location.coordinates[1] = tmp;
    });
}


/*
 changes from UTC to local time based on coordinates.
 Expects the date/time in UTC format in variable appearedOn
 May have to remove this if data team changes format.
 */
function tolocaltime(_data) {
    var tzwhere = require('tzwhere');
    //initialize the lib for time zone retrieval
    tzwhere.init();

    //iterate over whole data
    _data.forEach(function (element) {
        //Get Latitude/Longitude
        var lat = parseFloat(element.location.coordinates[0]);
        var lon = parseFloat(element.location.coordinates[1]);

        //compute the local time zone offset
        var offset = tzwhere.tzOffsetAt(lat, lon);
        //add the offset (milliseconds) to date
        var newDate = new Date(element.appearedOn);
        newDate = new Date(newDate.getTime() + offset);
        element.appearedOn = newDate.toJSON();
    });
}