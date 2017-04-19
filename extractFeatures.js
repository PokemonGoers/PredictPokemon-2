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
* 1.4. Address
* 1.5. City
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
var source = "source.json";
var output = "output.json";

var source_json = fs.readFileSync(source, 'utf8');
var dirty_data = JSON.parse(source_json);
var data = removeIncompleteData(dirty_data);

switchLatitudeLongitude(data);
tolocaltime(data);
addDayMonthYear(data);
addHourMinute(data);
addTimeOfDay(data);
//buggy atm
//addAddress(data);

fs.writeFileSync(output, JSON.stringify(data), 'utf8');

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
        var date = new Date(element.appearedOn);
        var hour = date.getHours();
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
    console.log("addTimeOfDay completed");
}


/*
 This function splits the time into two pieces: appearedHour appearedMinute.
 Expects the date/time in variable appearedOn.
 */
function addHourMinute(_data) {
    _data.forEach(function (element) {
        var date = new Date(element.appearedOn);
        element.appearedHour = date.getHours();
        element.appearedMinute = date.getMinutes();
    });
    console.log("addHourMinute completed");
}

/*
 This function splits the date into four pieces: appearedDayOfWeek appearedDay appearedMonth appearedYear.
 Expects the date/time in variable appearedOn.
 */
function addDayMonthYear(_data) {
    _data.forEach(function (element) {
        var date = new Date(element.appearedOn);
        element.appearedDayOfWeek = date.getDay();
        element.appearedDay = date.getDate();
        element.appearedMonth = date.getMonth();
        element.appearedYear = date.getFullYear();
    });
    console.log("addDayMonthYear completed");
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
    console.log("switchLatitudeLongitude completed");
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
    console.log("toLocalTime completed");
}

/*
 This function is TAKEN FROM @marwage's file latlngToAdress.js
 It adds the address in the field 'address' based on the coordinates.
 It also adds the city in the field 'city'.
 */
//buggy. gotta test more tomorrow
function addAddress(_data) {
    const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var xmlhttp = new XMLHttpRequest();

    var cnt = 0;
    _data.forEach(function (element) {
        var lat = element.location.coordinates[0];
        var lon = element.location.coordinates[1];
        var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='
            + lat + ',' + lon;
        var _address;
        var _city;


        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var data = JSON.parse(this.responseText);
                console.log(data);
                if(data.hasOwnProperty('results') && data.results !== null) {
                    if(data.results[0].hasOwnProperty('formattedAddress')) {
                        _address = data.results[0].formatted_address;
                    } else {
                        _address = "undefined";
                        console.log("undefined filled in for address");
                    }
                    if(data.results[1].hasOwnProperty('formattedAddress')) {
                        _city = data.results[1].formatted_address;
                    } else {
                        _city = "undefined";
                        console.log("undefined filled in for city");
                    }
                } else {
                    console.log("undefined filled in for address and city");
                    _address = "undefined";
                    _city = "undefined";
                }
            }
        };
        xmlhttp.open("GET", url, false);
        xmlhttp.send();
        cnt=cnt+1;
        console.log(cnt + ": " + xmlhttp.readyState);
        _data.address = _address;
        _data.city = _city;
    });
    console.log("addAddress completed");
}

//TAKEN FROM @bensLine' getApiData.js
//For Testing only. Later this part will be moved to the getAPI-part
/**
 * remove data entries which do not provided all required features
 * @param json_data data to filter
 * @returns {Array} array which contains only entries which provide all necessary features
 */
function removeIncompleteData(json_data) {
    var complete_data = [];

    json_data.forEach(function (element) {
        if (element["location"] !== null) {
            complete_data.push(element);
        }
    });
    console.log("removeIncompletedData completed");
    return complete_data;
}