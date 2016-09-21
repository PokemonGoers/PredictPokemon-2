/**
 * Created by matt on 15.09.16.
 */
var fs = require('fs');
var source = "json/Data_with_hour/Data_50000_control_set/Data_with_hour.json";
var destination1 = "json/Data_with_hour/Data_50000_control_set/Data_with_hour2.json";
var destination2 = "json/Data_with_hour/Data_50000_control_set/Data_with_hour3.json";
var destination3 = "json/Data_with_hour/Data_50000_control_set/Data_with_hour_final/";

//cooc_json1(source, destination1);
//cooc_json2(destination1, destination2);
//cooc_json3(destination2, destination3, 50000);
//evaluate(destination2, destination3);
cheap_convert_arff("json/Data_with_hour/Data_50000_control_set/Data_with_hour_final/cooc_final_1.json", "json/Data_with_hour/Data_50000_control_set/Data_with_hour_final/cooc_final_1.arff");


//adds 5 "Integers" to the json data. This will be the storage for information.
function cooc_json1 (filePathName, destination) {
    var raw_data = fs.readFileSync(filePathName, 'utf8');
    var data = JSON.parse(raw_data);
    console.log("data length : " + data.length);
    var out = '[';
    var count = 0;
    data.forEach(function(row){
        var name = "cooccurCellId90_";
        var new_row={};
        new_row['_id']=row['_id'];
        new_row['cellId_90m']=row['cellId_90m'];
        new_row['appearedHour']=row['appearedHour'];
        new_row['appearedDay']=row['appearedDay'];
        new_row['appearedMonth']=row['appearedMonth'];
        new_row['class']=row['class'];
        new_row[name + "0"]=0;
        new_row[name + "32"]=0;
        new_row[name + "64"]=0;
        new_row[name + "96"]=0;
        new_row[name + "128"]=+0;
        var new_row_string = JSON.stringify(new_row);
        out = out + new_row_string + ',\n';
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
    out = out.slice(0, -2);
    out = out + '\n]';
    fs.appendFileSync(destination, out, 'utf8');
};

//traverses the data and adds a cooccurrance into the integers.
//e.g. cooccurrCellId90_0 -> 32 bit -> 32 "booleans"
function cooc_json2 (filePathName, destination) {
    var data = JSON.parse(fs.readFileSync(filePathName, 'utf8'));
    var count_coocs=0;
    var sum = (data.length+1)*data.length/2;
    for(var i = 0;i <data.length; i++){
        if(i%1000 == 0) console.log(i + " rows processed with " + count_coocs + " co-occurances.");
        if(i%10000 == 0){
            var current_count = 100*(sum - (data.length -i+1)*(data.length-i)/2)/(sum);
            console.log("Roughly at " + current_count.toFixed(2) + "%");
        }
        for(var j = i+1; j<data.length; j ++){
            if(data[i].cellId_90m === data[j].cellId_90m){
                if(within24(data[i], data[j])) {
                    if (data[i].class !== data[j].class) {
                        insert_id_to_int(data[i], data[j]);
                        count_coocs++;
                    }
                }
            }
        }
    }
    fs.writeFileSync(destination, JSON.stringify(data, null,'\t'), 'utf8');
};

//returns whether or not the sighting data2 was within 24 hours before data1
function within24(data1, data2){
    var date1 = new Date(2016, data1.appearedMonth, data1.appearedDay, data1.appearedHour);
    var date2 = new Date(2016, data2.appearedMonth, data2.appearedDay, data2.appearedHour);
    //86400000 milliseconds = 24 hours.
    if(date1 < date2 && date1.getTime()-date2.getTime() < 86400000){
        return true;
    } else {
        return false;
    }
}

//Magic. Do not touch.
function insert_id_to_int(data_1, data_2){
    var str = 'cooccurCellId90_';
    var int_1 = Math.floor(data_1.class/32);
    var int_2 = Math.floor(data_2.class/32);
    data_2[str + (int_1*32)] = data_2[str + (int_1*32)] | (1<<(data_1.class%32));
    data_1[str + (int_2*32)] = data_1[str + (int_2*32)] | (1<<(data_2.class%32));
}


//convertes the cooccurance to a readable format
function cooc_json3(source, destination, dump_size){
    var data = JSON.parse(fs.readFileSync(source, 'utf8'));
    var out = '[';
    var count = 0;
    data.forEach(function (row) {
        count ++;
        var new_row = {};
        new_row['_id']=row['_id'];
        new_row['class']=row['class'];
        for(var i = 1; i <=151; i++){
            new_row['cooc_' + i] = (row["cooccurCellId90_" + (32*Math.floor(i/32))] & (1<<(i%32)))!==0;
        }
        var new_row_string = JSON.stringify(new_row);
        out = out + new_row_string + ',\n';

        if(count%dump_size ===0 ){
            console.log("Wrote " + count + " rows.");
            fs.writeFileSync(destination + "cooc_final_" + Math.floor(count/dump_size) + ".json", out.slice(0, -2) + "\n]", 'utf8');
            out='['
        }
    });
    //fs.writeFileSync(destination + "cooc_final_" + Math.ceil(count/dump_size) + ".json", out.slice(0, -2) + "\n]", 'utf8');

}

function evaluate(source1, source2){
    var data = JSON.parse(fs.readFileSync(source1, 'utf8'));
    var eval_array = new Array(151);

    var count_array = [];
    for(var i = 0; i<151; i++){
        eval_array[i]= new Array(151);
        for(var j = 0; j<151; j++){
            eval_array[i][j]=0;
        }
    }
    //init count_array
    for(var i = 0; i<151; i++){
        count_array[i]=0;
    }
    console.log("Count array initiated.");
    //count the amount of sightings
    data.forEach(function(row){
        count_array[row.class-1]++;
    });
    console.log("Count array filled.");

    //lose old data and continue with processed data
    for(var i = 1; i<=3; i++){
        console.log("Working on dataset " + i);
        data = JSON.parse(fs.readFileSync(source2 + "cooc_final_" + i + '.json', 'utf8'));
        //sum up coocs
        data.forEach(function (row) {
            for(var j = 1; j<=151; j++){
                if(row["cooc_" + j]){
                    eval_array[row.class-1][j-1]++;
                }
            }
        });
    }

    //at this point eval_array has all the coocs summed up.
    //it should be symetrical
    for(var i = 0; i<151; i++){
        for(var j = 0; j<151; j++){
            process.stdout.write(eval_array[i][j] + " ");
        }
        console.log('\n');
    }
}

function cheap_convert_arff(source, destination){
    var data = JSON.parse(fs.readFileSync(source, 'utf8'));
    var out = "@relation \'cooc\'\n@attribute _id string\n@attribute class {1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,133,134,135,136,137,138,139,140,141,142,143,147,148,149}\n";
    for(var i = 1; i<=151; i ++){
        out += "@attribute cooc_" + i + " {false, true}\n";
    }
    out+="@data\n";
    data.forEach(function(row){
        var values = [];
        for (var key in row) {
            values.push(row[key])
        }
        out += values.join(',') + '\n';
    });
    fs.writeFileSync(destination, out, 'utf8');
};