/**---------------------------------------------------------------------------*/
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the dynamic content area drop event handler. As the single point  */
/** of exit for all workflows, processing the drop event for the object       */
/** dropped must encompass all business rules.                                */
/*----------------------------------------------------------------------------*/
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       04-Sep-2015 NA   Initial design.                    */
/**---------------------------------------------------------------------------*/
'use strict';

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from local application files:     */
/**---------------------------------------------------------------------------*/
var config = require('./config');

/**---------------------------------------------------------------------------*/
/** Function: processDrop                                                     */
/** Processes the object dropped on the dyno.                                 */
/**                                                                           */
/** @param {object} e        The object dropped on the dyno.                  */
/**---------------------------------------------------------------------------*/
function processDrop(e) {
    /**-----------------------------------------------------------------------*/
    /** Get the file array from the drop event:                               */
    /** TODO: Process for dropping an entire directory.                       */
    /**-----------------------------------------------------------------------*/
    var dt = e.dataTransfer;
    var files = dt.files;
    var count = files.length;

    /**-----------------------------------------------------------------------*/
    /** Stop the event from bubbling:                                         */
    /**-----------------------------------------------------------------------*/
    e.preventDefault();
    e.stopPropagation();

    /**-----------------------------------------------------------------------*/
    /** Enter a loop to process all of the files:                             */
    /**-----------------------------------------------------------------------*/
    for (var i = 0; i < files.length; i++) {
        /**-------------------------------------------------------------------*/
        /** Process according to the file extension type:                     */
        /**-------------------------------------------------------------------*/
        var ext = files[i].name.substr(files[i].name.lastIndexOf('.')+1);
        switch(ext.toUpperCase()) {
            /**---------------------------------------------------------------*/
            /** Windows office document:                                      */
            /**---------------------------------------------------------------*/
            case 'DOC':
            case 'DOCX':
            case 'XLS':
            case 'XLSX':
                /**-----------------------------------------------------------*/
                /** TODO: Send the document to the server:                    */
                /**-----------------------------------------------------------*/
                document.getElementById('dyno').style.backgroundImage = 'url(./images/spiral-run-send.gif)';
                break;

            /**---------------------------------------------------------------*/
            /** Phembot JSON file:                                            */
            /**---------------------------------------------------------------*/
            case 'JSON':
                /**-----------------------------------------------------------*/
                /** Read the conents of the JSON file:                        */
                /**-----------------------------------------------------------*/
                document.getElementById('dyno').style.backgroundImage = 'url(./images/factory.gif)';
                var parser = new xml2js.Parser();
                fs.readFile(files[i].path, function(err, data) {
                    parser.parseString(data, function (err, result) {
                        /**---------------------------------------------------*/
                        /** Send an event to the renderer side to issue an OS */
                        /** shell command for the MS Word phembot template to */
                        /** process the phembot file:                         */
                        /**---------------------------------------------------*/
                        alert(JSON.stringify(result));
                        var shellCommand = config.pathWord + '\ /q\ /x\ /l' + 
                                           config.pathEffector + '\ ' + 
                                           config.pathPhembots + files[i].path;
                        ipc.send('osShell', shellCommand);
                    });
                });
                break;

            /**---------------------------------------------------------------*/
            /** TODO: XML file:                                               */
            /**---------------------------------------------------------------*/
            case 'XML':
                fs.readFile(files[i].path, function(err, data) {
                    var data = fs.readFileSync(files[i].name, 'utf-8');
                    var jsonText = toJson.xmlToJson(data);
                    alert(jsonText);
                });
                break;

            /**---------------------------------------------------------------*/
            /** Other file types are not currently supported:                 */
            /**---------------------------------------------------------------*/
            default:
                console.log('Unknown file type');
        }

    }
}

exports.processDrop = processDrop;

// console.log("File " + i + ": (" + (typeof files[i]) + ") : <" + files[i] + " > " +
// files[i].name + " " + files[i].size + "\n");
// Assuming xmlDoc is the XML DOM Document
// var jsonText = JSON.stringify(xmlToJson(xmlDoc));
// var jsonText = JSON.parse(xmlToJson(contents));
// var contents = fs.readFileSync files[i].name
// console.log(files[i].path);
// console.log(files[i].name.substr(files[i].name.lastIndexOf('.')+1));
