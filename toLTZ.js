var fs = require('fs');
var tzwhere = require('tzwhere')

/*
This script takes the current (02.09.16) JSON file created over the database API
and converts the UTC to a local time based on the location. In case the location
information is inaccessible, the tuple is omitted.

Note 1: The format of the current data's coordinates is LON/LAT, this might change
        in the future. In this case just switch the vars lat and lon.

Note 2: Quick and dirty. Constructed as a one-time solution and learning experience.
        Don't judge. The tzwhere lib could be interesting in the future
*/

//initialize vars and call tolocaltime
var source = 'dummy_input.json';
var destination = 'dummy_output.json';
var json_data_LTZ = [];
tolocaltime(source, destination);


function tolocaltime(source, destination) {
    //read data and parse to array
    var data = fs.readFileSync(source, 'utf8');
    var json_data = JSON.parse(data);

    //initialize the lib for time zone retrieval
    tzwhere.init();

    //iterate over whole data
    json_data.forEach(function (element) {

        //the if clause filters out the tuples without a usable location.
        //dirty and specialized to this data only
        if(
            typeof element.location != 'undefined' &&
            element.location != null &&
            typeof element.location.coordinates != 'undefined' &&
            typeof element.location.coordinates[0] != 'undefined' &&
            typeof element.location.coordinates[1] != 'undefined'
            ){

            var lon = parseFloat(element.location.coordinates[0]);
            var lat = parseFloat(element.location.coordinates[1]);
      
            //compute the local time zone offset
            var offset = tzwhere.tzOffsetAt(lat, lon);
            //add the offset (milliseconds) to date
            var newDate = new Date(element.appearedOn);
            newDate = new Date(newDate.getTime() + offset);
            element.appearedOn = newDate.toJSON();
            json_data_LTZ.push(element);
        }
    });
    fs.writeFileSync(destination, JSON.stringify(json_data_LTZ), 'utf8');

}