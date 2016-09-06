const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlhttp = new XMLHttpRequest();

var latitude = 48.148626;
var longitude = 11.568694;

var address = latlngToAdress(latitude, longitude);

function latlngToAdress(latitude, longitude) {
    var url = 'http://nominatim.openstreetmap.org/reverse?format=json'
                + '&lat=' + latitude + '&lon=' + longitude;

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

function getCity(data) {
    return data['address']['city'];
}
