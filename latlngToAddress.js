const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlhttp = new XMLHttpRequest();

var latitude = 48.148626;
var longitude = 11.568694;

var address = latlngToAdress(latitude, longitude);

function latlngToAdress(latitude, longitude) {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='
                + latitude + ',' + longitude;

    var address;

    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            address = getAdress(data);
        }
    };
    xmlhttp.open("GET", url, false);
    xmlhttp.send();

    return address;
}

function getAdress(data) {
    return data.results[0].formatted_address;
}
