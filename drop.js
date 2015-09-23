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
var ipc = require('ipc');                      // Inter-process communication
var fs = require('fs');
var shell = require('shelljs');
var config = require('./config');
var util = require('./util');

/**---------------------------------------------------------------------------*/
/** Get the OS type and set the paths accordingly:                            */
/**---------------------------------------------------------------------------*/
var OSName = util.getOSName();
if (OSName === "Windows") {
    var pathLocal = config.pathLocalWin;
    var pathRemote = config.pathRemoteWin;
}
else if (OSName="MacOS") {
    var pathLocal = config.pathLocalMacOS;
    var pathRemote = config.pathRemoteMacOS;
}
else {
    var pathLocal = config.pathLocalLinux;
    var pathRemote = config.pathRemoteLinux;
}

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
            case 'DOCM':
            case 'DOCX':
                document.getElementById('dyno').style.backgroundImage = 
                                                    'url(./images/colour.gif)';
                var phembotFile = createPhembot(files[i].path, 'css');
                shell.exec(
                    '"' + config.pathOSExec + '/' + config.pathWrite + '"' + 
                    '\ /q\ /x\ /l"' + pathRemote + '/' + 
                    config.pathRemoteEffectors + '/' + config.fileRemoteEffector + '"' + 
                    '\ ' + '"' + phembotFile + '"', {async:true}, function(code, output) {
                    ipc.send('refresh');
                });
                break;

            /**---------------------------------------------------------------*/
            /** Windows office spreadsheet:                                   */
            /**---------------------------------------------------------------*/
            case 'XLS':
            case 'XLSX':
                /**-----------------------------------------------------------*/
                /** TODO: Send the document to the server:                    */
                /**-----------------------------------------------------------*/
                document.getElementById('dyno').style.backgroundImage = 
                                                    'url(./images/factory.gif)';
                var success = shell.exec(
                    '"' + config.pathOSExec + '/' + config.pathWrite + '"' + 
                    '\ /q\ /x\ /l"' + config.pathRemote + '/' + 
                    config.pathEffectors + '/' + config.fileEffector + '"' + 
                    '\ ' + '"' + config.pathRemote + '/' + config.pathPhembots +
                    '/anyxl.json"', {async:true}).output;
                break;

            /**---------------------------------------------------------------*/
            /** Phembot JSON file:                                            */
            /**---------------------------------------------------------------*/
            case 'JSON':
                /**-----------------------------------------------------------*/
                /** Read the contents of the JSON file:                       */
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
                        var shellCommand = config.pathOSExec + '/' +
                                           config.pathWrite + '\ /q\ /x\ /l' +
                                           config.pathEffector + '/' + 
                                           config.fileEffector + '\ ' +
                                           files[i].path;
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

/**---------------------------------------------------------------------------*/
/** Function: createPhembot                                                   */
/** Creates a phembot to invoke the external OS functionality.                */
/**                                                                           */
/** @param {string} type     The type of list object.                         */
/** @param {number} data     The list data to post.                           */
/**---------------------------------------------------------------------------*/
function createPhembot (receptor, secondMessenger) {
    /**-----------------------------------------------------------------------*/
    /** Set the API URI to post the data to:                                  */
    /**-----------------------------------------------------------------------*/
    var phembot = {
    'ref': 'T1',
    'type': 'CAL',
    'status': 'O',
    'title': 'Calibration of KA-100 Weighing Balance',
    'icon': 'cal.png',
    'receptor': {
        'ref': 'D67',
        'type': 'Instruction',
        'version': 1,
        'title': 'Product X',
        'document': receptor
    },
    'messenger': {
        'precedence': [
            'css'
        ],
        'css': {
            'effector': 'Word',
            'userConfirm': true,
            'userMessage': 'Overwrite application style sheet?',
            'save': false,
            'close': true,
            'msgData': {
                'outputPath': '__dirname',
                'outputFile': '/theme-active.css'
            }
        }
    },
    'user': {
        'name': 'David Paspa',
        'timezone': 'Asia/Singapore',
        'uriAPI': 'http://localhost:8888/api/',
        'website': 'http://ipoogi.com',
        'feedback': 'http://ipoogi.com',
        'pathOSExec': 'c:/',
        'pathWrite': 'Program Files/Microsoft Office/Office14/winword',
        'pathSheet': 'Program Files/Microsoft Office/Office14/excel',
        'pathRemote': 'q:/',
        'pathRemoteLogo': 'logo.png',
        'pathRemoteEffector': 'effectors',
        'pathRemoteMessengers': 'effectors',
        'pathRemotePhembots': 'phembots',
        'pathRemoteReceptors': 'receptors',
        'fileRemoteEffector': 'pb.dotm',
        'pathLocal': 'x:/Business/ipoogi',
        'pathLocalReceptorsIn': 'receptors/in',
        'pathLocalReceptorsOut': 'receptors/out',
        'pathLocalPhembotsIn': 'effectors/in',
        'pathLocalPhembotsOut': 'effectors/out',
        'pathLocalReceptors': 'x:/business/ipoogi'
    },
    "error": {
        "number": 0,
        "procedure": "",
        "message": "",
        "parameters": []
    },
    "history": {
    }
}


/*
    var phembot = {
    contentPayload: {
        doc: 'D11',
        logo: 'q:/logo.png',
        ref: 'P72',
        title: 'Product x',
        type: 'BMR',
        ver: '1',
        secondMessenger: config.pathRemote + '/' + config.pathMessengers + '/' + secondMessenger + '.dotm',
        receptor: receptor,
        saveReceptor: 'False',
        closeReceptor: 'True'
    },
    css: {
        userConfirm: 'True',
        userMessage: 'Overwrite application style sheet?',
        msgData: {
            outputPath: __dirname + '/theme-active.css'
        }
    },
    contentHistory: {}
}
*/

    var phembotFileName = pathRemote + '/' + config.pathRemotePhembots + '/bot' + util.getTimeStamp() + '.json';
//    var phembotFileName = pathRemote + '/' + config.pathRemotePhembots + '/thenewbot.json';
    fs.writeFile(phembotFileName, JSON.stringify(phembot), function (err) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Wrote phembot file ' + phembotFileName);
        }
    });
    return phembotFileName;
}
// console.log("File " + i + ": (" + (typeof files[i]) + ") : <" + files[i] + " > " +
// files[i].name + " " + files[i].size + "\n");
// Assuming xmlDoc is the XML DOM Document
// var jsonText = JSON.stringify(xmlToJson(xmlDoc));
// var jsonText = JSON.parse(xmlToJson(contents));
// var contents = fs.readFileSync files[i].name
// console.log(files[i].path);
// console.log(files[i].name.substr(files[i].name.lastIndexOf('.')+1));
