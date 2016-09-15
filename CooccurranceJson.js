/**
 * Created by matt on 15.09.16.
 */
var fs = require('fs');
var source = "json/pokeDump_2.json";
var destination1 = "json/pokeDump_2co.json";
var destination2 = "json/pokeDump_2cooccurrance.json";

//cooc_json1(source);
cooc_json2(destination1);


function cooc_json1 (filePathName) {
    var data = JSON.parse(fs.readFileSync(filePathName, 'utf8'));
    var new_data = [];
    var count = 0;
    data.forEach(function(row){
        for(var i = 1; i <= 151; i++){
            var name = "cooccurCellId90_" + i;
            new_data.push(row);
            new_data[0][name]=false;
        }
        count ++;
        if(count%50000===0 && count!==0){
            console.log(count + " files processed.");
            if(count==50000){
                fs.writeFileSync(destination, new_data, 'utf8');
                new_data = [];
            } else {
                fs.appendFileSync(destination, new_data, 'utf8');
                new_data = [];
            }
        }
    });
};


function cooc_json2 (filePathName) {
    var data = JSON.parse(fs.readFileSync(filePathName, 'utf8'));
    console.log("Huhu");
};