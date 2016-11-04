/**
 * Created by Benjamin on 22.09.2016.
 */

var S2 = require('s2-geometry').S2;
var fs = require('fs');

// add two times 1 to handle face of s2 key separately from s2 key parts
const s2levels = [1, 1, 2, 3, 4, 6, 8, 10, 12, 13, 14, 15, 17];
const lastLevel = s2levels[s2levels.length - 1];
var s2levelIndices = s2levels.reduce(function (object, value, i) {
    object[i] = value;
    return object;
}, {});

function createCellIdGroups(sourcePath, destinationPath) {
    var file = fs.readFileSync(sourcePath, 'utf8');
    var places = JSON.parse(file);
    var cellGroups = {
        "levels": s2levels,
        "places": {}
    };

    places.forEach(function (place) {
        var currentGroup = cellGroups.places;
        addPlace(place, currentGroup, 0);
    });

    fs.writeFileSync(destinationPath, JSON.stringify(cellGroups, null, 4), 'utf8');
}

function addPlace(place, currentGroup, levelIndex) {
    var key = S2.latLngToKey(place.latitude, place.longitude, s2levelIndices[levelIndex]);
    var parts = key.split('/');
    var face = parseInt(parts[0]);
    var position = parts[1];

    if (levelIndex === 0) {
        key = face;
    }
    else {
        key = position;
    }

    if (s2levelIndices[levelIndex] !== lastLevel) {
        if (!currentGroup.hasOwnProperty(key)) {
            currentGroup[key] = [place];
        }
        else if (currentGroup[key].constructor === Array) {
            placeArray = currentGroup[key].slice();
            placeArray.push(place);
            currentGroup[key] = {};
            placeArray.forEach(function (placeToMoveDown) {
                addPlace(placeToMoveDown, currentGroup[key], levelIndex + 1);
            });
        }
        else {
            addPlace(place, currentGroup[key], levelIndex + 1);
        }
    }
    else {
        if (!currentGroup.hasOwnProperty(key)) {
            currentGroup[key] = [];
        }

        currentGroup[key].push(place);
    }
}

function printCellCount(places, indent) {
    var text;
    if (places.constructor === Array) {
        text = indent + places.length;
        return text + '\n'
    }
    else {
        text = indent + Object.keys(places).length;
        for (key in places) {
            text += '\n' + printCellCount(places[key], indent + '\t');
        }
        return text;
    }
}

var src = __dirname + '/../json/pokestops.json';
var out = __dirname + '/../json/pokestop_groups.json';
createCellIdGroups(src, out);

// create log file to see cell counts
var file = fs.readFileSync(out, 'utf8');
var cellGroups = JSON.parse(file);
var text = printCellCount(cellGroups.places, '');
fs.writeFileSync(__dirname + '/../json/cellGroup-pokestop.log', text, 'utf8');
