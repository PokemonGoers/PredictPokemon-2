const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlhttp = new XMLHttpRequest();

console.log(getPopulation(latLonToCity(48.148641, 11.568721)));
console.log(getPopulation(latLonToCity(49.112507, 9.737344)));
console.log(getPopulation(latLonToCity(43.271147, 6.637755)));
console.log(getPopulation(latLonToCity(35.685924, 139.757869)));

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
    var city;
    if (data['address']['city'] !== undefined) {
        city = data['address']['city'];
    }
    if (data['address']['town'] !== undefined) {
        city = data['address']['town'];
    }
    if (data['address']['village'] !== undefined) {
        city = data['address']['village'];
    }
    city = city.replace(/ /g, '_');
    city = city.replace(/ä/g, 'ae');
    city = city.replace(/ü/g, 'ue');
    city = city.replace(/ö/g, 'oe');
    return city;
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
    var i = 0;
    var number_string = '';
    var splitted = str.split('City</th>\n<td>');
    if (splitted.length < 3) {
        splitted = str.split('Total</th>\n<td>');
    }
    if (splitted.length < 3) {
        return -1;
    }
    while (splitted[2][i] !== '<') {
        number_string += splitted[2][i];
        i++;
    }
    number_string = number_string.replace(/,/g, '');
    return parseInt(number_string);
}
