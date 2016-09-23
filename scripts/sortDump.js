/**
 * Created by matt on 23.09.16.
 */
var fs = require('fs');
var source = '../json/pokeDump_2.json';
var destination = '../json/pokeDump_2_sorted.json';

sortDump(source, destination);

function sortDump(_source, _destination){
    console.log("Hello again!");
    var data = fs.readFileSync(_source, 'utf8');
    var json_data = [];
    json_data=JSON.parse(data);
    json_data.sort(function(a, b){
        var date_a = new Date(a.appearedLocalTime);
        var date_b = new Date(b.appearedLocalTime);
        return -date_a.valueOf() + date_b.valueOf();
    });
    fs.writeFileSync(_destination, JSON.stringify(json_data, null, "\t"), 'utf8');
    return;
}