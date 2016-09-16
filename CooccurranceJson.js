/**
 * Created by matt on 15.09.16.
 */
var fs = require('fs');
var source = "json/dataDump_reduced_for_cooc_2.json";
var destination1 = "json/pokeDump_2co.json";
var destination2 = "json/pokeDump_2cooccurrance.json";

cooc_json1(source, destination1);
//cooc_json2(source);


function cooc_json1 (filePathName, destination) {
    var raw_data = fs.readFileSync(filePathName, 'utf8');
    var data = JSON.parse(raw_data);
    console.log("data length : " + data.length);
    var out = "";
    var count = 0;
    data.forEach(function(row){
        var name = "cooccurCellId90_";
        var new_row={};

        new_row['_id']=row['_id'];
        new_row['cellId_90m']=row['cellId_90m'];
        new_row['appearedDay']=row['appearedDay'];
        new_row['appearedMonth']=row['appearedMonth'];
        new_row['class']=row['class'];
        new_row[name + "0"]=0;
        new_row[name + "32"]=0;
        new_row[name + "64"]=0;
        new_row[name + "96"]=0;
        new_row[name + "128"]=0;
        console.log("new row length : " + new_row.length);
        out.concat(new_row);
        console.log("out length : " + out.length);
        //console.log(new_row);
        count ++;
        if(count%50000===0){
            console.log(count + " files processed.");
            if(count==50000){

                fs.writeFileSync(destination, out, 'utf8');
                out = "";
            } else {
                fs.appendFileSync(destination, out, 'utf8');
                out="";
            }
        }
    });
};


function cooc_json2 (filePathName) {
    var data = JSON.parse(fs.readFileSync(filePathName, 'utf8'));
    console.log("Huhu");
};