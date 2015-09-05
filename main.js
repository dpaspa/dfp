/**---------------------------------------------------------------------------*/
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the browser script for the Electron application for the dfp       */
/** (desktop focal point) application. The dfp is the desktop client          */
/** application for integrating the user's workflows into the QMS back end.   */
/*----------------------------------------------------------------------------*/
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       30-Aug-2015 NA   Initial design.                    */
/**---------------------------------------------------------------------------*/
'use strict';

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from other application files:     */
/**---------------------------------------------------------------------------*/
var config = require('./config');
var drop = require('./drop');

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from other node packages:         */
/**---------------------------------------------------------------------------*/
var path = require('path');
var ipc = require('ipc');
var remote = require('remote');
var notifier = require('node-notifier');
var shell = require('shell');
var schedule = require('node-schedule');
var moment = require('moment-timezone');
var dynamics = require('dynamics.js');
var fs = require('fs');
var xml2js = require('xml2js');
var watch = require('watch');
var io = require('socket.io');

/**---------------------------------------------------------------------------*/
/** Declare global program variables:                                         */
/**---------------------------------------------------------------------------*/
var lastdynamic;

/******************************************************************************/
/**                                                                           */
/** STARTUP   STARTUP   STARTUP   STARTUP   STARTUP   STARTUP   STARTUP   STA */
/**                                                                           */
/** Get the phembot and master list catalog data for the main page:           */
/******************************************************************************/
getListMainPage('phembot', 6, true);
getListMainPage('catalog-list', 4, false);
getListMainPage('plan', 4, false);


/******************************************************************************/
/**                                                                           */
/** HANDLEBARS   HANDLEBARS   HANDLEBARS   HANDLEBARS   HANDLEBARS   HANDLEBA */
/**                                                                           */
/** These templates are compiled by Handlebars into HTML objects. The         */
/** location of template insertion is defined by the {{}} tags in index.html. */
/******************************************************************************/

/**---------------------------------------------------------------------------*/
/** Render the phembot and catalog lists in the main dfp window:              */
/**---------------------------------------------------------------------------*/
function renderTemplate(type, data) {
    /**-----------------------------------------------------------------------*/
    /** Get the template HTML and compile it with Handlebars:                 */
    /**-----------------------------------------------------------------------*/
    var templateSource = document.getElementById('template-' + type).innerHTML;
    var template = Handlebars.compile(templateSource);

    /**-----------------------------------------------------------------------*/
    /** Get the results HTML and insert the resolved HTML:                    */
    /**-----------------------------------------------------------------------*/
    var resultsPlaceholder = document.getElementById('result-' + type);
    resultsPlaceholder.innerHTML = template(data);
}

/******************************************************************************/
/**                                                                           */
/** EVENT LISTENERS   EVENT LISTENERS   EVENT LISTENERS   EVENT LISTENERS     */
/**                                                                           */
/** These set up the callbacks for the application user interation events.    */
/** Events are triggered on the html objects defined in index.html.           */
/******************************************************************************/

/**---------------------------------------------------------------------------*/
/** Calendar window has been closed:                                          */
/**---------------------------------------------------------------------------*/
ipc.on('calendarClose', function() {
    document.getElementById("cal-label").style.backgroundColor = '#1f2023';
});

/**---------------------------------------------------------------------------*/
/** Dashboard window has been closed:                                         */
/**---------------------------------------------------------------------------*/
ipc.on('dashboardClose', function() {
    document.getElementById("dash-label").style.backgroundColor = '#1f2023';
});

/**---------------------------------------------------------------------------*/
/** Body event. Used to check for a phembot or list-catlog selection:         */
/**---------------------------------------------------------------------------*/
document.body.addEventListener('click', function(e){
    /**-----------------------------------------------------------------------*/
    /** Get the listener event target html object and check it is valid:      */
    /**-----------------------------------------------------------------------*/
    var el = e.target;
    if (!el) return;

    /**-----------------------------------------------------------------------*/
    /** Get the target of the html object and check that is valid. The list   */
    /** items have their object type and id as the href target attribute:     */
    /**-----------------------------------------------------------------------*/
    var ref = el.target;
    if (!ref) return;

    /**-----------------------------------------------------------------------*/
    /** Stop the event bubbling through the application so it can be handled  */
    /** exclusively in the local code below:                                  */
    /**-----------------------------------------------------------------------*/
    e.preventDefault();

    /**-----------------------------------------------------------------------*/
    /** Get the location of the 'underscore' character which separates the    */
    /** list item type and id or name:                                        */
    /**-----------------------------------------------------------------------*/
    var delimChar = ref.indexOf("_");

    /**-----------------------------------------------------------------------*/
    /** Check if this is from the list tab for the catalog of master data     */
    /** lists:                                                                */
    /**-----------------------------------------------------------------------*/
    if (ref.substring(0, delimChar) == 'catalog-list') {
        /**-------------------------------------------------------------------*/
        /** Get the catalog list name and the full list data from the backend */
        /** API. Send it to the renderer side:                                */
        /**-------------------------------------------------------------------*/
        var name = ref.substring(delimChar + 1);
//        var data = getListDetailPage(name, 0);
        getListDetailPage(name, 0);
    } 

    /**-----------------------------------------------------------------------*/
    /** Check if this is from the phembot task list:                          */
    /**-----------------------------------------------------------------------*/
    else if (ref.substring(0, delimChar) == 'phembot') {
        /**-------------------------------------------------------------------*/
        /** TODO:                                                             */
        /**-------------------------------------------------------------------*/
    }
    else {
        /**-------------------------------------------------------------------*/
        /** What to do:                                                       */
        /**-------------------------------------------------------------------*/
    }
});

/**---------------------------------------------------------------------------*/
/** Act label event. Used to display the act selection box on the dfp         */
/** window:                                                                   */
/**---------------------------------------------------------------------------*/
document.getElementById('act-label').addEventListener('click', function() {
    setDisplayContext('act');
})

/**---------------------------------------------------------------------------*/
/** Calender label event. Used to render the new calendar window:             */
/**---------------------------------------------------------------------------*/
document.getElementById('cal-label').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    document.getElementById("cal-label").style.backgroundColor = '#828282';
    ipc.send('calendar');
})

/**---------------------------------------------------------------------------*/
/** Chat network button events:                                               */
/**---------------------------------------------------------------------------*/
document.getElementById('chat-external').addEventListener('click', function() {
    document.getElementById('chat-background').style.backgroundColor = '#ff8295';
});
document.getElementById('chat-internal').addEventListener('click', function() {
    document.getElementById('chat-background').style.backgroundColor = '#82ff98';
});
document.getElementById('chat-support').addEventListener('click', function() {
    document.getElementById('chat-background').style.backgroundColor = '#82e0ff';
});

/**---------------------------------------------------------------------------*/
/** Chat label event. Used to display the chat box on the dfp window:         */
/**---------------------------------------------------------------------------*/
document.getElementById('chat-label').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display, show the chat div and hide the dynamic      */
    /** content div:                                                          */
    /**-----------------------------------------------------------------------*/
    if (document.getElementById("chat-form").offsetParent === null) {
        setDisplayContext('dynamic-chat');
    }
    else {
        setDisplayContext('dynamic-dyno');
    }
})

/**---------------------------------------------------------------------------*/
/** Chat close event. Used to close the chat box on the dfp window:           */
/**---------------------------------------------------------------------------*/
document.getElementById('chat-close').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display, show the chat div and hide the dynamic      */
    /** content div:                                                          */
    /**-----------------------------------------------------------------------*/
    setDisplayContext('dynamic-dyno');
})

/**---------------------------------------------------------------------------*/
/** Check label event. Used to display the check content:                     */
/**---------------------------------------------------------------------------*/
document.getElementById('check-label').addEventListener('click', function() {
    setDisplayContext('check');
})

/**---------------------------------------------------------------------------*/
/** Dashboard label click event. Used to render the new dashboard window:     */
/**---------------------------------------------------------------------------*/
document.getElementById('dash-label').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    document.getElementById("dash-label").style.backgroundColor = '#828282';
    ipc.send('dashboard');
})

/**---------------------------------------------------------------------------*/
/** Do label click event. Used to display the phembot list:                   */
/**---------------------------------------------------------------------------*/
document.getElementById('do-label').addEventListener('click', function() {
    setDisplayContext('do');
})

/**---------------------------------------------------------------------------*/
/** Dynamic content click event. Used to reset the dyno display:              */
/** TODO: Display dyno display options... get more content:                   */
/**---------------------------------------------------------------------------*/
document.getElementById('dyno').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** For now just reset the dynamic image:                                 */
    /**-----------------------------------------------------------------------*/
    setDisplayContext('dyno');
})

/**---------------------------------------------------------------------------*/
/** Dynamic content drop event. This is the user's single point of exit for   */
/** all workflows used to send files for processing.                          */
/**---------------------------------------------------------------------------*/
document.getElementById('dyno').addEventListener('drop', function(e) {
    /**-----------------------------------------------------------------------*/
    /** Process the drop event based on what was dropped on the dyno:         */
    /**-----------------------------------------------------------------------*/
    drop.processDrop(e);
});

/**---------------------------------------------------------------------------*/
/** List label event. Used to display the master data list catalog:           */
/**---------------------------------------------------------------------------*/
document.getElementById('list-label').addEventListener('click', function() {
    setDisplayContext('list');
})

/**---------------------------------------------------------------------------*/
/** Message chat event. Used to add the message to the message queue display: */
/**---------------------------------------------------------------------------*/
document.getElementById('m-send').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Send the chat message to the server via a socket:                     */
    /**-----------------------------------------------------------------------*/
    var chatter = document.getElementById('m').value;
    if (chatter.length > 0) {
        /**-------------------------------------------------------------------*/
        /** Send the chat message to the server via a socket:                 */
        /**-------------------------------------------------------------------*/
        var socket = io();
        socket.emit('chat message', chatter);
        socket.send(chatter);

        /**-------------------------------------------------------------------*/
        /** Clear the input box and add the message to the list:              */
        /** TODO: Full refresh but only on first message:                     */
        /**-------------------------------------------------------------------*/
        document.getElementById('m').value = '';
        var newElement = document.createElement('li');
        newElement.innerHTML = chatter;
        document.getElementById("messages").appendChild(newElement);
    }
});

/**---------------------------------------------------------------------------*/
/** Plan label click event. Used to display the QA plan (list):               */
/**---------------------------------------------------------------------------*/
document.getElementById('plan-label').addEventListener('click', function() {
    setDisplayContext('plan');
})

/**---------------------------------------------------------------------------*/
/** Preferences icon event. Used to display the settings screen:              */
/**---------------------------------------------------------------------------*/
document.getElementById('prefs-label').addEventListener('click', function() {
    setDisplayContext('prefs');
})

/**---------------------------------------------------------------------------*/
/** Search box key press event. This is used to display learning chunks which */
/** are rendered in the new chunk windows:                                    */
/**---------------------------------------------------------------------------*/
document.getElementById('search-key').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
        var searchText = document.getElementById('search-key').value;
        ipc.send('learning', searchText);
    }
})

/**---------------------------------------------------------------------------*/
/** User icon click event. Used to display the user profile and login details.*/
/**---------------------------------------------------------------------------*/
document.getElementById('user-label').addEventListener('click', function() {
    setDisplayContext('user');
/*    var el = document.getElementById("user-label")
    dynamics.animate(el, 
        {
        translateX: -250,
        scale: 2,
        opacity: 0.5
        }, 
        {
        type: dynamics.spring,
        frequency: 200,
        friction: 200,
        duration: 1500
        }
    )
*/
//    ipc.send('event', 'user');
});

/**---------------------------------------------------------------------------*/
/** Application quit icon click event to close the application:               */
/**---------------------------------------------------------------------------*/
document.getElementById('quit').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Send the event to the renderer process to close down gracefully:      */
    /**-----------------------------------------------------------------------*/
    ipc.send('quit');
})

/**---------------------------------------------------------------------------*/
/** Function: setDisplayContext                                               */
/** Sets the display of the application by showing or hiding things.          */
/**                                                                           */
/** @param {string} context  The application display context name.            */
/**---------------------------------------------------------------------------*/
function setDisplayContext(context) {
    /**-----------------------------------------------------------------------*/
    /** Hide the dyno and shot the chat box if required:                      */
    /**-----------------------------------------------------------------------*/
    var checkdynamic;
    if (context === 'dynamic-chat') {
        lastdynamic = 'chat';
        document.getElementById("chat-label").style.backgroundColor = '#828282';
        document.getElementById('chat').style.display = 'block';
        document.getElementById('dyno').style.display = 'none';
    }

    /**-----------------------------------------------------------------------*/
    /** Close the chat box and show the dyno if required:                     */
    /**-----------------------------------------------------------------------*/
    else if (context === 'dynamic-dyno') {
        lastdynamic = 'dyno';
        document.getElementById("chat-label").style.backgroundColor = '#1f2023';
        document.getElementById('chat').style.display = 'none';
        document.getElementById('dyno').style.display = 'block';
    }
    else {
        /**-------------------------------------------------------------------*/
        /** Reset all the labels:                                             */
        /**-------------------------------------------------------------------*/
        document.getElementById("act-label").style.backgroundColor = '#1f2023';
        document.getElementById("check-label").style.backgroundColor = '#1f2023';
        document.getElementById("do-label").style.backgroundColor = '#1f2023';
        document.getElementById("list-label").style.backgroundColor = '#1f2023';
        document.getElementById("plan-label").style.backgroundColor = '#1f2023';
        document.getElementById("prefs-label").style.backgroundColor = '#1f2023';
        document.getElementById("user-label").style.backgroundColor = '#1f2023';

        /**-------------------------------------------------------------------*/
        /** Hide everything in the top part as not just a dyno change:        */
        /**-------------------------------------------------------------------*/
        document.getElementById('act-content').style.display = 'none';
        document.getElementById('check-content').style.display = 'none';
        document.getElementById('do-content').style.display = 'none';
        document.getElementById('list-content').style.display = 'none';
        document.getElementById('plan-content').style.display = 'none';
        document.getElementById('prefs-content').style.display = 'none';
        document.getElementById('searcher').style.display = 'none';
        document.getElementById('user-content').style.display = 'none';

        /**-------------------------------------------------------------------*/
        /** Hide the quit button. It is only shown on the user screen:        */
        /**-------------------------------------------------------------------*/
        document.getElementById('quit').style.display = 'none';
    }

    /**-----------------------------------------------------------------------*/
    /** Process according to display context:                                 */
    /**-----------------------------------------------------------------------*/
    switch(context) {
        /**-------------------------------------------------------------------*/
        /** Improvement selection options when "Act" label is clicked:        */
        /**-------------------------------------------------------------------*/
        case('act'):
            checkdynamic = true;
            document.getElementById("act-label").style.backgroundColor = '#828282';
            document.getElementById('act-content').style.display = 'block';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** Check selection options when "Check" label is clicked:            */
        /**-------------------------------------------------------------------*/
        case('check'):
            checkdynamic = true;
            document.getElementById("check-label").style.backgroundColor = '#828282';
            document.getElementById('check-content').style.display = 'block';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** Phembot task list when "Task" label is clicked:                   */
        /**-------------------------------------------------------------------*/
        case('do'):
            checkdynamic = true;
            document.getElementById("do-label").style.backgroundColor = '#828282';
            document.getElementById('do-content').style.display = 'block';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** Reset the dynamic display dyno when it is clicked:                */
        /**-------------------------------------------------------------------*/
        case('dyno'):
            document.getElementById('dyno').style.backgroundImage = 'url(./images/spiral-static.png)';
            break;

        /**-------------------------------------------------------------------*/
        /** Catalog of master data lists when "List" label is clicked:        */
        /**-------------------------------------------------------------------*/
        case('list'):
            checkdynamic = true;
            document.getElementById("list-label").style.backgroundColor = '#828282';
            document.getElementById('list-content').style.display = 'block';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** Catalog of master data lists when "List" label is clicked:        */
        /**-------------------------------------------------------------------*/
        case('plan'):
            checkdynamic = true;
            document.getElementById("plan-label").style.backgroundColor = '#828282';
            document.getElementById('plan-content').style.display = 'block';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** Preferences screen when the settings icon is clicked:             */
        /**-------------------------------------------------------------------*/
        case('prefs'):
            checkdynamic = false;
            document.getElementById("prefs-label").style.backgroundColor = '#828282';
            document.getElementById('prefs-content').style.display = 'block';
            document.getElementById('chat').style.display = 'none';
            document.getElementById('dyno').style.display = 'none';
            break;

        /**-------------------------------------------------------------------*/
        /** Catalog of master data lists when "List" label is clicked:        */
        /**-------------------------------------------------------------------*/
        case('user'):
            checkdynamic = false;
            document.getElementById("user-label").style.backgroundColor = '#828282';
            document.getElementById('user-content').style.display = 'block';
            document.getElementById('chat').style.display = 'none';
            document.getElementById('dyno').style.display = 'none';
            document.getElementById('quit').style.display = 'block';
            break;

        default:
    }

    /**-----------------------------------------------------------------------*/
    /** Return to chat or dyno if both were hidden:                           */
    /**-----------------------------------------------------------------------*/
    if (checkdynamic) {
        if (lastdynamic === 'chat') {
            document.getElementById('chat').style.display = 'block';
        }
        else {
            document.getElementById('dyno').style.display = 'block';
        }
    }
}

/******************************************************************************/
/**                                                                           */
/** MODULE FUNCTIONS   MODULE FUNCTIONS   MODULE FUNCTIONS   MODULE FUNCTIONS */
/**                                                                           */
/** Funtions such as schedule and file system events using external node      */
/** modules.                                                                  */
/******************************************************************************/

/**---------------------------------------------------------------------------*/
/** Module: node-schedule                                                     */
/** Periodically runs to refresh the data display.                            */
/** schedule.scheduleJob('30 * * * * *', function(){  //cron style            */
/**                                                                           */
/** Set a new rule to run when the clock second hand is at 0 and also at 30,  */
/** which is every 30 seconds or two times per minute. Fast enough:           */
/**---------------------------------------------------------------------------*/
var rule = new schedule.RecurrenceRule();
rule.second = [0, 30];

/**---------------------------------------------------------------------------*/
/** Schedule a job on the 30 second rule to update the main dfp window lists: */
/**---------------------------------------------------------------------------*/
schedule.scheduleJob(rule, function(){
    getListMainPage('phembot', 6, true);
    getListMainPage('catalog-list', 4, false);
    getListMainPage('plan', 4, false);
});

/**---------------------------------------------------------------------------*/
/** Module: watch                                                             */
/** Monitor the local file store for any changes.                             */
/**                                                                           */
/** Setup the fs.watch object to monitor the local files directory.           */
/**---------------------------------------------------------------------------*/
watch.watchTree(config.pathFiles, function (f, curr, prev) {
    /**-----------------------------------------------------------------------*/
    /** Assume there will be nothing to do:                                   */
    /**-----------------------------------------------------------------------*/
    var processFIle = false;

    /**-----------------------------------------------------------------------*/
    /** Check if finished walking the directory tree.                         */
    /**-----------------------------------------------------------------------*/
    if (typeof f == "object" && prev === null && curr === null) {
        /**-------------------------------------------------------------------*/
        /** Nothing more to do:                                               */
        /**-------------------------------------------------------------------*/
    } 
    
    /**-----------------------------------------------------------------------*/
    /** Process any new file:                                                 */
    /**-----------------------------------------------------------------------*/
    else if (prev === null) {
        processFIle = true;
    } 
    
    /**-----------------------------------------------------------------------*/
    /** Check if the file was removed:                                        */
    /**-----------------------------------------------------------------------*/
    else if (curr.nlink === 0) {
        /**-------------------------------------------------------------------*/
        /** Just forget about it:                                             */
        /**-------------------------------------------------------------------*/
    } 
    else {
        /**-------------------------------------------------------------------*/
        /** The file was changed in some way. Better process it:              */
        /**-------------------------------------------------------------------*/
        processFIle = true;
    }

    /**-----------------------------------------------------------------------*/
    /** Check if the file is new or changed:                                  */
    /**-----------------------------------------------------------------------*/
    if (processFIle) {
        /**-------------------------------------------------------------------*/
        /** The file was changed in some way. Better process it:              */
        /**-------------------------------------------------------------------*/
        console.log(f + ' is being processed');
        var parser = new xml2js.Parser();
        fs.readFile(f, function(err, data) {
            postAPI('list', data);
        });
    }
});

/**---------------------------------------------------------------------------*/
/** Module: node-notifier                                                     */
/** Function: createNotification                                              */
/** Creates a native OS notification with the phembot data.                   */
/**                                                                           */
/** @param {string} phembot  The phembot object.                              */
/**---------------------------------------------------------------------------*/
function createNotification(phembot) {
    /**-----------------------------------------------------------------------*/
    /** Check if the phembot due date is today:                               */
    /**-----------------------------------------------------------------------*/
/*    if (isWithin24Hours(phembot.formatted_time)) { */
        /**-------------------------------------------------------------------*/
        /** Create the OS native notification:                                */
        /** TODO: Replace phembot.formatted_time                              */
        /**-------------------------------------------------------------------*/
/*        notifier.notify({
            'title': phembot.Title,
            'message': phembot.Title + ' is due soon on ' + phembot.Type,
            'icon': path.join(__dirname, '/menuIcon1.png'),
            'wait': true,
            'open': phembot.Ref
        });
    }
*/
}

/**---------------------------------------------------------------------------*/
/** Function: isWithin24Hours                                                 */
/** Checks if a phembot task due time is within one day (24 hours).           */
/**                                                                           */
/** @param {string} timeDue  The due time of the phembot task.                */
/**---------------------------------------------------------------------------*/
function isWithin24Hours(timeDue) {
    return moment(timeDue, 'DD MMM YYYY, ddd, hh:mm a').isBefore(moment().add(24, 'hour'))
}

/******************************************************************************/
/**                                                                           */
/** API DATA CALLS   API DATA CALLS   API DATA CALLS   API DATA CALLS   API   */
/**                                                                           */
/** Send and receive data to the mongoDB backend via the nodejs HTTP API.     */
/******************************************************************************/

/**---------------------------------------------------------------------------*/
/** Function: getListMainPage                                                 */
/** Gets the list data with a limit on the number of items returned from the  */
/** server.                                                                   */
/**                                                                           */
/** @param {string} type     The type of list data to get.                    */
/** @param {number} num      The number of list items to get or 0 for all.    */
/** @param {boolean} notify  Whether or not to set a system notification      */
/**                          message.                                         */
/**---------------------------------------------------------------------------*/
function getListMainPage(type, num, notify) {
    /**-----------------------------------------------------------------------*/
    /** Declare local variables:                                              */
    /**-----------------------------------------------------------------------*/
    var uri;
    var xhr = new XMLHttpRequest();

    /**-----------------------------------------------------------------------*/
    /** Set the API uri if a phembot list request:                            */
    /**-----------------------------------------------------------------------*/
    if (type === 'phembot') {
        uri = config.uriAPI + 'phembot/' + num;
    } 

    /**-----------------------------------------------------------------------*/
    /** Set the API uri if a QA plan list request:                            */
    /**-----------------------------------------------------------------------*/
    else if (type === 'plan') {
        uri = config.uriAPI + 'list/qa' + num;
    } 
    else {
        /**-------------------------------------------------------------------*/
        /** Set the API uri for the phembot catalog list request:             */
        /**-------------------------------------------------------------------*/
        uri = config.uriAPI + 'list/catalog/' + num;
    }

    /**-----------------------------------------------------------------------*/
    /** Set up the response callback function:                                */
    /**-----------------------------------------------------------------------*/
    xhr.onload = function(){
        /**-------------------------------------------------------------------*/
        /** Get the API response data:                                        */
        /**-------------------------------------------------------------------*/
        var body = JSON.parse(this.responseText);

        /**-------------------------------------------------------------------*/
        /** Get an object handle to the contents of the _items object in the  */
        /** reponse. MongoDB sends the response as an _items object so we     */
        /** want the data inside that object:                                 */
        /**-------------------------------------------------------------------*/
        var data = {};
        data[type] = body._items;

        /**-------------------------------------------------------------------*/
        /** If a phembot and task due notifications are required then check   */
        /** if any phembots are due soon and require an OS native             */
        /** notification message:                                             */
        /** TODO: Won't work with limited list. Need separate API call for    */
        /** pending phembots regardless of how many:                          */
        /**-------------------------------------------------------------------*/
        if (type === 'phembot' && notify) {
            var i;
            var arr = [];
            arr = data.phembot;
            for (i = 0; i < arr.length; i++) { 
                createNotification(arr[i]);
            }
        }

        /**-------------------------------------------------------------------*/
        /** Re-render the handlebars templates with the new object data:      */
        /**-------------------------------------------------------------------*/
        renderTemplate(type, data);
    };

    /**-----------------------------------------------------------------------*/
    /** Send the API request:                                                 */
    /**-----------------------------------------------------------------------*/
    xhr.open('GET', uri, true);
    xhr.send();
}

/**---------------------------------------------------------------------------*/
/** Function: getListDetailPage                                               */
/** Gets the list data with a limit on the number of items returned from the  */
/** server.                                                                   */
/**                                                                           */
/** @param {string} name     The list name which is the same as the mongoDB   */
/**                          collection name.                                 */
/** @param {number} num      The number of list items to get or 0 for all.    */
/**---------------------------------------------------------------------------*/
function getListDetailPage(name, num) {
    /**-----------------------------------------------------------------------*/
    /** Declare local variables:                                              */
    /**-----------------------------------------------------------------------*/
    var uri;
    var xhr = new XMLHttpRequest();

    /**-----------------------------------------------------------------------*/
    /** Set the API uri with the list name and number to get:                 */
    /**-----------------------------------------------------------------------*/
    var uri = config.uriAPI + 'list/' + name;// + '/' + num;

    /**-----------------------------------------------------------------------*/
    /** Set up the response callback function:                                */
    /**-----------------------------------------------------------------------*/
    xhr.onload = function() {
        /**-------------------------------------------------------------------*/
        /** Get the API response data:                                        */
        /**-------------------------------------------------------------------*/
        var body = JSON.parse(this.responseText);

        /**-------------------------------------------------------------------*/
        /** Get an object handle to the contents of the _items object in the  */
        /** reponse. MongoDB sends the response as an _items object so we     */
        /** want the data inside that object:                                 */
        /**-------------------------------------------------------------------*/
        var data = {};
        data = body._items;
        ipc.send('datatable', data);
    };

    /**-----------------------------------------------------------------------*/
    /** Send the API request:                                                 */
    /**-----------------------------------------------------------------------*/
    xhr.open('GET', uri, true);
    xhr.send();
}


function postAPI(type, item){
    var uri;
    var xhr = new XMLHttpRequest();

    if (type === 'phembot') {
        uri = config.uriAPI + 'phembot';
    } 

    else {
        uri = config.uriAPI + 'list';
    }

    xhr.onload = function(){
        var body = JSON.parse(this.responseText);
    };

    xhr.open('POST', uri, true);
    xhr.send(item);
}

/*
function DrawSpiral(mod) {
    var c = document.getElementById("myCanvas");
    var cxt = c.getContext("2d");
    var centerX = 115;
    var centerY = 55;

    cxt.save();
    cxt.clearRect(0, 0, c.width, c.height);

    cxt.beginPath();
    cxt.moveTo(centerX, centerY);

    var STEPS_PER_ROTATION = 60;
    var increment = 2 * Math.PI / STEPS_PER_ROTATION;
    var theta = increment;

    while (theta < 40 * Math.PI) {
        var newX = centerX + theta * Math.cos(theta - mod);
        var newY = centerY + theta * Math.sin(theta - mod);
        cxt.lineTo(newX, newY);
        theta = theta + increment;
    }
    cxt.stroke();
    cxt.restore();
}

var counter = 10;
    setInterval(function () {
        DrawSpiral(counter);
        counter += 0.275;
    }, 10);
*/

//    shell.openExternal(el.href + '&ref=list%id=' + ref.substring(6));

//webview.addEventListener('dragover', function(e) {
//  e.preventDefault();
//});

/*document.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
});*/

//        data['listURI'] = 'file:///home/dpaspa/Dropbox/Business/ipoogi/development/electron/table.html';
//        data['website'] = config.website;
//
//        var socket = new io.Socket();
