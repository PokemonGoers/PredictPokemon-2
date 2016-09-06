const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlhttp = new XMLHttpRequest();

var latitude = 43.271338;
var longitude = 6.638375;

var city = latLonToCity(latitude, longitude);

console.log(city);

function latLonToCity(latitude, longitude) {
    var url = 'http://nominatim.openstreetmap.org/reverse?format=json'
                + '&lat=' + latitude + '&lon=' + longitude;

    var city;

    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            city = getCity(data);
        }
    };
    xmlhttp.open("GET", url, false);
    xmlhttp.send();

    return city;
}

function getCity(data) {
    if (data['address']['city'] !== undefined) {
        return data['address']['city'];
    }
    if (data['address']['town'] !== undefined) {
        return data['address']['town'];
    }
    if (data['address']['village'] !== undefined) {
        return data['address']['village'];
    }
    return 'failure\n' + data;
}
