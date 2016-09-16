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
    console.log(offset);
    for (var i = 0; i < 25; i++) {
        console.log(str[offset+i]);
    }
    var input = '';
    var spaces = 0;
    var i = 0;
    while (spaces < 2) {
        if (str[offset+13+i] === ' ') {
            spaces++;
        }
        input += str[offset+13+i];
        i++;
    }
    var population_string = '';
    i = 0;
    while (input[i] !== ' ') {
        population_string += input[i];
        i++;
    }
    var population = parseFloat(population_string);
    if (input.indexOf('million') > -1) {
        population = population * 1000000;
    }
    return population;
}
