const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlhttp = new XMLHttpRequest();

var latitude = 48.148641;
var longitude = 11.568721;

console.log(getPopulation(latLonToCity(latitude, longitude)));

function latLonToCity(latitude, longitude) {
    var url = 'http://nominatim.openstreetmap.org/reverse?format=json'
                + '&accept-language=en-US'
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

function getPopulation(place) {
    var url = 'https://en.wikipedia.org/wiki/' + place;

    var population;
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            population = extractNumber(this.responseText);
        }
    };
    xmlhttp.open("GET", url, false);
    xmlhttp.send();

    return population;
}

function extractNumber(str) {
    var offset = str.search('City</th>\n<td>');
    var splitted = str.split('City</th>\n<td>');
    var i = 0;
    var number_string = '';
    while (splitted[2][i] !== '<') {
        number_string += splitted[2][i];
        i++;
    }
    console.log(number_string);
    var population = parseFloat(number_string);
    return population;
}
