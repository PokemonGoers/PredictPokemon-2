/**
 * Created by Benni on 24.08.2016.
 */

/* global $ */


function load() {
    arffFromJSON(["dummy1.js", "dummy2.js", "dummy3.js", "dummy4.js"])
}

function arffFromJSON(fileNames) {
    var arff = header();
    arff.push("", "@DATA");

    // process json synchronously
    $.ajaxSetup({
        async: false
    });

    for (var f = 0; f < fileNames.length; f += 1) {
        $.getJSON(fileNames[f], function(json) {
            for(var i = 0; i < json.length; i += 1) {
                arff.push(dataRow(json[i]));
            }
        });
    }

    download(arff.join("\n"), "pokeDummyData.arff")
}

function header() {
    var lines = [];
    lines.push(
        "@RELATION pokeDummyData",
        "",
        "@ATTRIBUTE created NUMERIC",
        "@ATTRIBUTE downvote NUMERIC",
        "@ATTRIBUTE upvote NUMERIC",
        "@ATTRIBUTE lat NUMERIC",
        "@ATTRIBUTE lon NUMERIC",
        "@ATTRIBUTE pokemonId NUMERIC",
        "@ATTRIBUTE class {0, 1, 2, 3, 4, 5}"
);
    return lines;
}

function dataRow(pokeEntry) {
    var attributes = [];
    attributes.push(
        // attributes
        pokeEntry.created,      //:1470888125
        pokeEntry.downvotes,    //:0,
        pokeEntry.upvotes,      //:1,
        pokeEntry.latitude,     //:45.4342223592,
        pokeEntry.longitude,    //:12.3361350849,
        pokeEntry.pokemonId,    //:19,

        // class label
        classLabelCalculation(pokeEntry)    // in [0,5]
    );
    return attributes.join(",");
}

// use distance from reference point as class label. class label are categorized into different distance classes
function classLabelCalculation(pokeEntry) {
    var refLat = 45.438499;
    var refLon = 12.327120;
    var distance = getDistanceFromLatLonInKm(refLat, refLon, pokeEntry.latitude, pokeEntry.longitude);

    if (distance <= 1) {
        console.log("1km hit");
        return 0;
    }
    else if (distance <= 2) {
        console.log("2km hit");
        return 1;
    }
    else if (distance <= 50) {
        console.log("50km hit");
        return 2;
    }
    else if (distance <= 250) {
        return 3;
    }
    else if (distance <= 700) {
        return 4;
    }
    else {
        return 5
    }
}

function timeAttributes(timestamp) {
    var date = new Date(timestamp * 1000);

    // TODO create attributes for time range, e.g. separate day into 3h slices or into 12h, ... or 2 day intervals..
    // 4 hour slices make no sense on test data as it only contains entries which have been created within less than 5 minuets
    return {
        day: date.getDay(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        hour_4: Math.floor(date.getHours() / 4),
        seconds_10: Math.floor(date.getSeconds() / 10)
    }
}

// from http://stackoverflow.com/a/27943
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

// from http://stackoverflow.com/a/30832210
function download(text, name) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: "text/plain;charset=utf-8"});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
    console.log("done")
}