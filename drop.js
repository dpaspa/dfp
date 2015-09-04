function processDrop(e) {
    document.getElementById('dyno').style.backgroundImage = 'url(./images/spiral-run-send.gif)';

    var dt = e.dataTransfer;
    var files = dt.files;

    var count = files.length;

    e.preventDefault();
    e.stopPropagation();


//  alert('landed on ' + e.target);

//  alert("File Count: " + count + "\n");

    for (var i = 0; i < files.length; i++) {
//        console.log("File " + i + ": (" + (typeof files[i]) + ") : <" + files[i] + " > " +
//              files[i].name + " " + files[i].size + "\n");
        // Assuming xmlDoc is the XML DOM Document
        // var jsonText = JSON.stringify(xmlToJson(xmlDoc));
//        var jsonText = JSON.parse(xmlToJson(contents));
//        var contents = fs.readFileSync files[i].name
//        var data = fs.readFileSync(files[i].name, 'utf-8');
//        var jsonText = toJson.xmlToJson(data);
//        alert(jsonText);
        console.log(files[i].path);
        console.log(files[i].name.substr(files[i].name.lastIndexOf('.')+1));
        if (files[i].name.substr(files[i].name.lastIndexOf('.')+1) == 'json') {
            var parser = new xml2js.Parser();
            fs.readFile(files[i].path, function(err, data) {
                parser.parseString(data, function (err, result) {
                    alert(JSON.stringify(result));
                });
            });

        } else if (files[i].path.substr(files[i].path.lastIndexOf('.')+1) == 'xls') {
            document.getElementById('dyno').style.backgroundImage = 'url(./images/factory.gif)';
            ipc.send('event', 'excel');

        } else {
            ipc.send('event', 'word');
        }
    }
}

exports.processDrop = processDrop;
