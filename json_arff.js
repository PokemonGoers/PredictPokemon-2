var fs = require('fs');

var file = 'dummy1.json';
jsonToArff(file);


function jsonToArff(file) {
    var data = fs.readFileSync(file, 'utf8');
    var json_data = JSON.parse(data);

    var splited = file.split('.');
    var name = splited[0];

    var arff = '';
    arff = arff + '@RELATION ' + name + '\n' + '\n';

    var firstElement = json_data[0];
    for (var key in firstElement) {
        if (typeof firstElement[key] === 'string') {
            arff = arff + '@ATTRIBUTE ' + key + ' string\n';
        }
        if (typeof firstElement[key] === 'number'
                || typeof firstElement[key] === 'boolean') {
            arff = arff + '@ATTRIBUTE ' + key + ' numeric\n';
        }
    }

    arff = arff + '@ATTRIBUTE class {+1,-1}\n\n'

    fs.writeFileSync(name + '.arff', arff, 'utf8');
}
