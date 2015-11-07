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
var util = require('./util');

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from other node packages:         */
/**---------------------------------------------------------------------------*/
var ipc = require('ipc');
var http = require('http');
//var querystring = require('querystring');
var request = require('request');
var remote = require('remote');
var notifier = require('node-notifier');
//var Handlebars = require('handlebars');
//var Handlebars = require('lib/handlebars');
var schedule = require('node-schedule');
var moment = require('moment-timezone');
var dynamics = require('dynamics.js');
var fs = require('fs');
var xml2js = require('xml2js');
var watch = require('watch');
var socket = require('socket.io');

/**---------------------------------------------------------------------------*/
/** Declare global program variables:                                         */
/**---------------------------------------------------------------------------*/
var flipped = false;
var armedRoll = true;
var armedUnroll = false;
var lastdynamic;
var flipped = false;
var searchText = '';

/******************************************************************************/
/**                                                                           */
/** STARTUP   STARTUP   STARTUP   STARTUP   STARTUP   STARTUP   STARTUP   STA */
/**                                                                           */
/** Get the phembot and master list catalog data for the main page:           */
/******************************************************************************/
getListMainPage('cc', 0, true);
getListMainPage('check', 0, true);
getListMainPage('do', 0, true);
getListMainPage('list-master', 0, false);
getListMainPage('list-working', 0, false);
getListMainPage('ofi', 0, true);
getListMainPage('plan', 0, false);


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
/** Main window refresh complete:                                             */
/**---------------------------------------------------------------------------*/
ipc.on('render-finished', function() {
});

/**---------------------------------------------------------------------------*/
/** Calendar window has been closed:                                          */
/**---------------------------------------------------------------------------*/
ipc.on('calendarClose', function() {
    document.getElementById("cal-label").classList.remove('activeLabel');
});

/**---------------------------------------------------------------------------*/
/** Dashboard window has been closed:                                         */
/**---------------------------------------------------------------------------*/
ipc.on('dashboardClose', function() {
    document.getElementById("dash-label").classList.remove('activeLabel');
});

/**---------------------------------------------------------------------------*/
/** Main window has been rolled up:                                           */
/**---------------------------------------------------------------------------*/
ipc.on('rolled', function() {
    document.getElementById("roll-wrap").style.display = 'block';
    document.getElementById("roll-wrap").classList.add('activeRoll');
//    document.getElementById("roll-wrap").addEventListener('mouseover', unrollFunction, false);
});

/**---------------------------------------------------------------------------*/
/** Main window has been unrolled:                                            */
/**---------------------------------------------------------------------------*/
ipc.on('unrolled', function() {
    document.getElementById("roll-wrap").style.display = 'none';
    document.getElementById("roll-wrap").classList.remove('activeRoll');
//    document.addEventListener('mouseleave', rollFunction, false);
});


var rollFunction = function (e) {
//    document.removeEventListener('mouseleave', rollFunction, false);
    ipc.send('doRoll');
};



var unrollFunction = function (e) {
//    document.getElementById("roll-wrap").removeEventListener('mouseover', unrollFunction, false);
    ipc.send('doUnroll');

};

//document.getElementById("roll-wrap").addEventListener('mouseover', unrollFunction, false);

/**---------------------------------------------------------------------------*/
/** Body event. Used to check for a phembot or list-catlog selection:         */
/**---------------------------------------------------------------------------*/
document.body.addEventListener('click', function(e) {
    /**-----------------------------------------------------------------------*/
    /** Stop the event bubbling through the application so it can be handled  */
    /** exclusively in the local code below:                                  */
    /**-----------------------------------------------------------------------*/
    e.preventDefault();

    /**-----------------------------------------------------------------------*/
    /** Get the listener event target html object and check it is valid:      */
    /**-----------------------------------------------------------------------*/
    var el = e.target;
    if (!el) return;

    /**-----------------------------------------------------------------------*/
    /** Get the target of the html object and check it is valid. The list     */
    /** items have their object type and id as the href target attribute:     */
    /**-----------------------------------------------------------------------*/
    var ref = el.target;
    if (!ref) return;

    /**-----------------------------------------------------------------------*/
    /** Get the location of the 'underscore' character which separates the    */
    /** list item type and id or name:                                        */
    /**-----------------------------------------------------------------------*/
    var delimChar = ref.indexOf("_");
    var type = ref.substring(0, delimChar)
    var typeRef = ref.substring(delimChar + 1);

    /**-----------------------------------------------------------------------*/
    /** Check if this is from the list tab for the catalog of master data     */
    /** lists:                                                                */
    /**-----------------------------------------------------------------------*/
    if (type == 'list') {
        /**-------------------------------------------------------------------*/
        /** Get the catalog list name and the full list data from the backend */
        /** API. Send it to the renderer side:                                */
        /**-------------------------------------------------------------------*/
        ipc.send('datatable', typeRef);
//        getListDetailPage(name, 0);
    }

    /**-----------------------------------------------------------------------*/
    /** Check if this is from the phembot task list:                          */
    /**-----------------------------------------------------------------------*/
    else if (type == 'listPlan' || type == 'listDo' || 
             type == 'listCheck' || type == 'listAct' ||
             type == 'listCC' || type == 'listOFI') {
        /**-------------------------------------------------------------------*/
        /** Get the updated phembot and and display the details:              */
        /**-------------------------------------------------------------------*/
        ipc.send('phembot', ref);
//        getPhembot(type, ref);
    }
    else {
        /**-------------------------------------------------------------------*/
        /** What to do:                                                       */
        /**-------------------------------------------------------------------*/
        console.log('type ' + type + ' ref ' + typeRef);
        ipc.send('dock');
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
/** Menu cart icon event. Used to render the cart window:                     */
/**---------------------------------------------------------------------------*/
document.getElementById('cart-icon').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    ipc.send('cart');
})

/**---------------------------------------------------------------------------*/
/** Menu calender icon event. Used to render the new calendar window:         */
/**---------------------------------------------------------------------------*/
document.getElementById('cal-icon').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    document.getElementById("cal-label").classList.add('activeLabel');
    ipc.send('calendar');
})

/**---------------------------------------------------------------------------*/
/** Calender label event. Used to render the new calendar window:             */
/**---------------------------------------------------------------------------*/
document.getElementById('cal-label').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    document.getElementById("cal-label").classList.add('activeLabel');
    ipc.send('calendar');
})

/**---------------------------------------------------------------------------*/
/** Chat network button events:                                               */
/**---------------------------------------------------------------------------*/
document.getElementById('chat-external').addEventListener('click', function() {
    document.getElementById('chat-internal-select').style.display = 'none';
    document.getElementById('chat-external-select').style.display = 'block';
    document.getElementById('chat-support-select').style.display = 'none';
    document.getElementById('chat-background').classList.add('chatExternal');
    document.getElementById('chat-background').classList.remove('chatInternal');
    document.getElementById('chat-background').classList.remove('chatSupport');
});
document.getElementById('chat-internal').addEventListener('click', function() {
    document.getElementById('chat-internal-select').style.display = 'block';
    document.getElementById('chat-external-select').style.display = 'none';
    document.getElementById('chat-support-select').style.display = 'none';
    document.getElementById('chat-background').classList.add('chatExternal');
    document.getElementById('chat-background').classList.remove('chatExternal');
    document.getElementById('chat-background').classList.add('chatInternal');
    document.getElementById('chat-background').classList.remove('chatSupport');
});
document.getElementById('chat-support').addEventListener('click', function() {
    document.getElementById('chat-internal-select').style.display = 'none';
    document.getElementById('chat-external-select').style.display = 'none';
    document.getElementById('chat-support-select').style.display = 'block';
    document.getElementById('chat-background').classList.remove('chatExternal');
    document.getElementById('chat-background').classList.remove('chatInternal');
    document.getElementById('chat-background').classList.add('chatSupport');
});

/**---------------------------------------------------------------------------*/
/** Menu chat icon event. Used to display the chat box on the dfp window:     */
/**---------------------------------------------------------------------------*/
document.getElementById('chat-icon').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display, show the chat div and hide the dynamic      */
    /** content div:                                                          */
    /**-----------------------------------------------------------------------*/
    setDisplayContext('dynamic-chat');
    flipPanel();
    document.querySelector( "#nav-toggle" ).classList.toggle( "active" );
})

/**---------------------------------------------------------------------------*/
/** Chat label event. Used to display the chat box on the dfp window:         */
/**---------------------------------------------------------------------------*/
document.getElementById('chat-label').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display, show the chat div and hide the dynamic      */
    /** content div:                                                          */
    /**-----------------------------------------------------------------------*/
    if (document.getElementById("chat-label").classList.contains('activeLabel')) {
        setDisplayContext('dynamic-dyno');
    }
    else {
        setDisplayContext('dynamic-chat');
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
/** Menu dashboard icon click event. Used to render the new dashboard window: */
/**---------------------------------------------------------------------------*/
document.getElementById('dash-icon').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    document.getElementById("dash-label").classList.add('activeLabel');
    ipc.send('dashboard');
})

/**---------------------------------------------------------------------------*/
/** Dashboard label click event. Used to render the new dashboard window:     */
/**---------------------------------------------------------------------------*/
document.getElementById('dash-label').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    document.getElementById("dash-label").classList.add('activeLabel');
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
/** First cancel the dragenter and dragover events or it won't work as per    */
/** bug http://stackoverflow.com/questions/21339924/drop-event-not-firing-in- */
/** chrome.                                                                   */
/**---------------------------------------------------------------------------*/
document.getElementById('dyno').addEventListener('dragenter', function(e) {
  e.preventDefault();
});

document.getElementById('dyno').addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
});

document.getElementById('dyno').addEventListener('drop', function(e) {
    /**-----------------------------------------------------------------------*/
    /** Process the drop event based on what was dropped on the dyno:         */
    /**-----------------------------------------------------------------------*/
    drop.processDrop(e);
});

/**---------------------------------------------------------------------------*/
/** Menu learn icon event. Used to render the learning window:                */
/**---------------------------------------------------------------------------*/
document.getElementById('learn-icon').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    setDisplayContext('dynamic-learn');
    flipPanel();
    document.querySelector( "#nav-toggle" ).classList.toggle( "active" );
//    ipc.send('learning');
})

/**---------------------------------------------------------------------------*/
/** Chat label event. Used to display the chat box on the dfp window:         */
/**---------------------------------------------------------------------------*/
document.getElementById('learn-label').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display, show the chat div and hide the dynamic      */
    /** content div:                                                          */
    /**-----------------------------------------------------------------------*/
    if (document.getElementById("learn-label").classList.contains('activeLabel')) {
        setDisplayContext('dynamic-dyno');
    }
    else {
        setDisplayContext('dynamic-learn');
    }
})

/**---------------------------------------------------------------------------*/
/** List label event. Used to display the master data list catalog:           */
/**---------------------------------------------------------------------------*/
document.getElementById('list-label').addEventListener('click', function() {
    setDisplayContext('list');
})

/**---------------------------------------------------------------------------*/
/** Message chat event. Used to add the message to the message queue display: */
/**---------------------------------------------------------------------------*/
document.getElementById('m-send').addEventListener('click', function(e) {
    /**-----------------------------------------------------------------------*/
    /** Stop the event bubbling through the application so it can be handled  */
    /** exclusively in the local code below:                                  */
    /**-----------------------------------------------------------------------*/
    e.preventDefault();

    /**-----------------------------------------------------------------------*/
    /** Send the chat message to the server via a socket:                     */
    /**-----------------------------------------------------------------------*/
    var chatter = document.getElementById('m').value;
    if (chatter.length > 0) {
        /**-------------------------------------------------------------------*/
        /** Send the chat message to the server via a socket:                 */
        /**-------------------------------------------------------------------*/
//        socket.emit('chat message', chatter);
        socket.send('chat message', chatter);
//        socket.send(chatter);

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
document.getElementById('prefs-icon').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** Re-render the handlebars templates with the new object data:          */
    /**-----------------------------------------------------------------------*/
    ipc.send('prefs');
});

/**---------------------------------------------------------------------------*/
/** Search box key press event. This is used to display learning chunks which */
/** are rendered in the new chunk windows:                                    */
/**---------------------------------------------------------------------------*/
document.getElementById('search-key').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        searchText = document.getElementById('search-key').value;
        document.getElementById('learn-title').innerHTML = '<h2>' + searchText + '</h2>';
        document.getElementById('learn-detail').innerHTML = '<p>' + searchText + '</p>';
        setDisplayContext('dynamic-learn');
    }
})

document.getElementById('learn-more').addEventListener('click', function() {
    console.log(searchText);
    ipc.send('learning', searchText);
});

document.querySelector( "#nav-toggle" ).addEventListener( "click", function() {
    this.classList.toggle( "active" );
    flipPanel();
});

function flipPanel() {
    if (flipped) {
        document.getElementById('flip-menu').style.transform = ("rotateY(0deg)");
    }
    else {
        document.getElementById('flip-menu').style.transform = ("rotateY(180deg)");
    }
    flipped = !flipped;
}

/**---------------------------------------------------------------------------*/
/** User icon click event. Used to display the user profile and login details.*/
/**---------------------------------------------------------------------------*/
document.getElementById('user-icon').addEventListener('click', function() {
    ipc.send('user');
});

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

/**---------------------------------------------------------------------------*/
/** Application quit icon click event to close the application by sending the */
/** event to the renderer process to close down gracefully:                   */
/**---------------------------------------------------------------------------*/
document.getElementById('quit-icon').addEventListener('click', function() {
    ipc.send('quit');
});

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
        document.getElementById("chat-label").classList.add('activeLabel');
        document.getElementById('chat').style.display = 'block';
        document.getElementById('dyno').style.display = 'none';
        document.getElementById('learn').style.display = 'none';
        document.getElementById("learn-label").classList.remove('activeLabel');
    }

    /**-----------------------------------------------------------------------*/
    /** Close the chat box and show the dyno if required:                     */
    /**-----------------------------------------------------------------------*/
    else if (context === 'dynamic-dyno') {
        lastdynamic = 'dyno';
        document.getElementById("chat-label").classList.remove('activeLabel');
        document.getElementById('chat').style.display = 'none';
        document.getElementById('dyno').style.display = 'block';
        document.getElementById('learn').style.display = 'none';
        document.getElementById("learn-label").classList.remove('activeLabel');
    }

    /**-----------------------------------------------------------------------*/
    /** Close the chat box and hide the dyno if learning required:            */
    /**-----------------------------------------------------------------------*/
    else if (context === 'dynamic-learn') {
        lastdynamic = 'learn';
        document.getElementById("chat-label").classList.remove('activeLabel');
        document.getElementById('chat').style.display = 'none';
        document.getElementById('dyno').style.display = 'none';
        document.getElementById('learn').style.display = 'block';
        document.getElementById("learn-label").classList.add('activeLabel');
    }

    /**-----------------------------------------------------------------------*/
    /** Close the chat box and show the dyno if required:                     */
    /**-----------------------------------------------------------------------*/
    else if (context === 'dyno') {
    }
    else {
        /**--------------------------------------------------------------------*/
        /** Reset all the labels to set the active one later:                  */
        /**--------------------------------------------------------------------*/
        document.getElementById("act-label").classList.remove('activeLabel');
        document.getElementById("check-label").classList.remove('activeLabel');
        document.getElementById("do-label").classList.remove('activeLabel');
        document.getElementById("list-label").classList.remove('activeLabel');
        document.getElementById("plan-label").classList.remove('activeLabel');

        /**-------------------------------------------------------------------*/
        /** Hide everything in the top part as not just a dyno change:        */
        /**-------------------------------------------------------------------*/
        document.getElementById('act-cc-content').style.display = 'none';
        document.getElementById('act-ofi-content').style.display = 'none';
        document.getElementById('act-separator').style.display = 'none';
        document.getElementById('check-content').style.display = 'none';
        document.getElementById('do-content').style.display = 'none';
        document.getElementById('list-working-content').style.display = 'none';
        document.getElementById('list-separator').style.display = 'none';
        document.getElementById('list-master-content').style.display = 'none';
        document.getElementById('plan-content').style.display = 'none';
        document.getElementById('searcher').style.display = 'none';
    }

    /**-----------------------------------------------------------------------*/
    /** Process according to display context:                                 */
    /**-----------------------------------------------------------------------*/
    switch (context) {
        /**-------------------------------------------------------------------*/
        /** Improvement selection options when "Act" label is clicked:        */
        /**-------------------------------------------------------------------*/
        case ('act'):
            checkdynamic = true;
            document.getElementById('pane-title').innerHTML = '<h2>Opportunity For Improvement (OFI)</h2>';
            document.getElementById("act-label").classList.add('activeLabel');
            document.getElementById('act-cc-content').style.display = 'block';
            document.getElementById('act-ofi-content').style.display = 'block';
            document.getElementById('act-separator').style.display = 'block';
            document.getElementById('act-separator-title').innerHTML = '<h2>Controlling Change (CC)</h2>';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** Check selection options when "Check" label is clicked:            */
        /**-------------------------------------------------------------------*/
        case ('check'):
            checkdynamic = true;
            document.getElementById('pane-title').innerHTML = '<h2>Check completed tasks</h2>';
            document.getElementById("check-label").classList.add('activeLabel');
            document.getElementById('check-content').style.display = 'block';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** Phembot task list when "Task" label is clicked:                   */
        /**-------------------------------------------------------------------*/
        case ('do'):
            checkdynamic = true;
            document.getElementById('pane-title').innerHTML = '<h2>Upcoming tasks</h2>';
            document.getElementById("do-label").classList.add('activeLabel');
            document.getElementById('do-content').style.display = 'block';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** Reset the dynamic display dyno when it is clicked:                */
        /**-------------------------------------------------------------------*/
/*
        case ('dyno'):
            document.getElementById('dyno').style.backgroundImage = 'url(./images/spiral-static.png)';
            break;
*/

        /**-------------------------------------------------------------------*/
        /** Catalog of master data lists when "List" label is clicked:        */
        /**-------------------------------------------------------------------*/
        case ('list'):
            checkdynamic = true;
            document.getElementById('pane-title').innerHTML = '<h2>Working Lists</h2>';
            document.getElementById("list-label").classList.add('activeLabel');
            document.getElementById('list-working-content').style.display = 'block';
            document.getElementById('list-master-content').style.display = 'block';
            document.getElementById('list-separator').style.display = 'block';
            document.getElementById('list-separator-title').innerHTML = '<h2>Master Lists</h2>';
            document.getElementById('searcher').style.display = 'block';
            break;

        /**-------------------------------------------------------------------*/
        /** List of Quality Controls when the Quality Assurance Plan label    */
        /** is clicked:                                                       */
        /**-------------------------------------------------------------------*/
        case ('plan'):
            checkdynamic = true;
            document.getElementById('pane-title').innerHTML = '<h2>Quality Assurance Plan</h2>';
            document.getElementById("plan-label").classList.add('activeLabel');
            document.getElementById('plan-content').style.display = 'block';
            document.getElementById('searcher').style.display = 'block';
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
//rule.second = [0, 30];
rule.second = [0];

/**---------------------------------------------------------------------------*/
/** Schedule a job on the 30 second rule to update the main dfp window lists: */
/**---------------------------------------------------------------------------*/
schedule.scheduleJob(rule, function(){
    getListMainPage('cc', 0, true);
    getListMainPage('check', 0, true);
    getListMainPage('do', 0, true);
    getListMainPage('list-master', 0, false);
    getListMainPage('list-working', 0, false);
    getListMainPage('ofi', 0, true);
    getListMainPage('plan', 0, false);
});

/**---------------------------------------------------------------------------*/
/** Module: watch                                                             */
/** Monitor the local file store for any changes.                             */
/**                                                                           */
/** Setup the fs.watch object to monitor the local files directory.           */
/**---------------------------------------------------------------------------*/
watch.watchTree(config.pathLocal + '/' + config.pathLocalReceptorsIn, function (f, curr, prev) {
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
//        var parser = new xml2js.Parser();
        fs.readFile(f, 'utf8', function(err, data) {
            if (err) {
                console.log(err);
            }
            else {
                var obj = JSON.parse(data);
                postData('list', obj);
            }
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
/** Function: getListURI                                                      */
/** Gets the API URI path for the specified data.                             */
/**                                                                           */
/** @param {string} type     The type of list data to get.                    */
/** @param {number} num      The number of list items to get or 0 for all.    */
/** @param {number} name     The master list name.                            */
/**---------------------------------------------------------------------------*/
function getListURI(type, num, name) {
    /**-----------------------------------------------------------------------*/
    /** Declare local variables:                                              */
    /**-----------------------------------------------------------------------*/
    var uri = '';

    /**-----------------------------------------------------------------------*/
    /** Process according to list context:                                    */
    /**-----------------------------------------------------------------------*/
    switch (type) {
        /**-------------------------------------------------------------------*/
        /** Change Control (CC):                                              */
        /**-------------------------------------------------------------------*/
        case ('cc'):
            uri = '/list/listActCC/' + num;
            break;

        /**-------------------------------------------------------------------*/
        /** Phemobots pending checking prior to completion:                   */
        /**-------------------------------------------------------------------*/
        case ('check'):
            uri = '/list/listCheck/' + num;
            break;

        /**-------------------------------------------------------------------*/
        /** Do, or phembot task list:                                         */
        /**-------------------------------------------------------------------*/
        case ('do'):
            uri = '/list/listDo/' + num;
            break;

        /**-------------------------------------------------------------------*/
        /** Master list:                                                      */
        /**-------------------------------------------------------------------*/
        case ('list-master'):
            uri = '/catalogLists/master';
            break;

        /**-------------------------------------------------------------------*/
        /** Master list:                                                      */
        /**-------------------------------------------------------------------*/
        case ('list-working'):
            uri = '/catalogLists/working';
            break;

        /**-------------------------------------------------------------------*/
        /** Opportunity For Improvement (OFI):                                */
        /**-------------------------------------------------------------------*/
        case ('ofi'):
            uri = '/list/listActOFI/' + num;
            break;

        /**-------------------------------------------------------------------*/
        /** Quality Assurance Plan (list of Quality Controls):                */
        /**-------------------------------------------------------------------*/
        case ('plan'):
            uri = '/list/listPlan/' + num;
            break;

        /**-------------------------------------------------------------------*/
        /** Unknown type:                                                     */
        /**-------------------------------------------------------------------*/
        default:
            uri = '/' + name;// + '/' + num;
    }

    /**-----------------------------------------------------------------------*/
    /** Return the URI path to the caller:                                    */
    /**-----------------------------------------------------------------------*/
    return uri;
}

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
    /** Get the requested page list URI to request the data from the server:  */
    /**-----------------------------------------------------------------------*/
    var uri = getListURI(type, num, '');

    /**-----------------------------------------------------------------------*/
    /** Set the http options to be used by the request:                       */
    /**-----------------------------------------------------------------------*/
    var options = {
       host: config.host,
       port: config.port,
       method: 'GET',
       path: uri
    };

    /**-----------------------------------------------------------------------*/
    /** Define the callback function used to deal with the response:          */
    /**-----------------------------------------------------------------------*/
    var callback = function (response) {
        /**-------------------------------------------------------------------*/
        /** Continuously update the stream with data as it arrives:           */
        /**-------------------------------------------------------------------*/
        var body = '';
        response.on('data', function(data) {
            body += data;
        });

        /**-------------------------------------------------------------------*/
        /** The data has been received completely:                            */
        /**-------------------------------------------------------------------*/
        response.on('end', function() {
            /**---------------------------------------------------------------*/
            /** If a phembot and task due notifications are required then     */
            /** check if any phembots are due soon and require an OS native   */
            /** notification message:                                         */
            /** TODO: Won't work with limited list. Need separate API call    */
            /** for pending phembots regardless of how many:                  */
            /**---------------------------------------------------------------*/
            var data = {};
            data[type] = JSON.parse(body);
            var arr = [];
            arr = Object.keys(data).map(function(k) { return data[k] });
            if (type === 'phembot' && notify) {
                var i;
                for (i = 0; i < arr.length; i++) {
                createNotification(arr[i]);
                }
            }

            /**---------------------------------------------------------------*/
            /** Re-render the handlebars templates with the new object data:  */
            /**---------------------------------------------------------------*/
            renderTemplate(type, data);
        });
    }

    /**-----------------------------------------------------------------------*/
    /** Make a request to the server:                                         */
    /**-----------------------------------------------------------------------*/
    var req = http.request (options, callback);
    req.end();
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
//function getListDetailPage(name, num) {
    /**-----------------------------------------------------------------------*/
    /** Get the requested page list URI to request the data from the server:  */
    /**-----------------------------------------------------------------------*/
//    var uri = '/table/' + name;

    /**-----------------------------------------------------------------------*/
    /** Set the http options to be used by the request:                       */
    /**-----------------------------------------------------------------------*/
//    var options = {
//       host: config.host,
//       port: config.port,
//       method: 'GET',
//       path: uri
//    };

    /**-----------------------------------------------------------------------*/
    /** Define the callback function used to deal with the response:          */
    /**-----------------------------------------------------------------------*/
//    var callback = function (response) {
        /**-------------------------------------------------------------------*/
        /** Continuously update the stream with data as it arrives:           */
        /**-------------------------------------------------------------------*/
//        var body = '';
//        response.on('data', function(data) {
//            body += data;
//        });

        /**-------------------------------------------------------------------*/
        /** The data has been received completely:                            */
        /**-------------------------------------------------------------------*/
//        response.on('end', function() {
            /**---------------------------------------------------------------*/
            /** Display the detail list form:                                 */
            /**---------------------------------------------------------------*/
//            ipc.send('datatable', name);
//        });
//    }

    /**-----------------------------------------------------------------------*/
    /** Make a request to the server:                                         */
    /**-----------------------------------------------------------------------*/
//    var req = http.request (options, callback);
//    req.end();
//}


/**---------------------------------------------------------------------------*/
/** Function: postData                                                        */
/** Posts the list data to the server.                                        */
/**                                                                           */
/** @param {string} type     The type of list object.                         */
/** @param {number} data     The list data to post.                           */
/**---------------------------------------------------------------------------*/
function postData(type, obj) {
    /**-----------------------------------------------------------------------*/
    /** Set the API URI to post the data to:                                  */
    /**-----------------------------------------------------------------------*/
    var body = JSON.stringify(obj);
    if (type === 'phembot') {
        var uriServer = '/listPhembots';
    }
    else {
        var uriServer = '/lists';
    }

    var options = {
        uri: 'http://' + config.host + ':' + config.port + uriServer,
        method: 'POST',
        headers: {},
        body: body
    };

    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(body);

    console.log('posting data ' + body);

    request.post(options, function (error, response, body) {
        if (error) {
            console.log(error);
        }
        else if (!error && response.statusCode == 200) {
            console.log(body) // Print the shortened url.
        }
    });
}

/**---------------------------------------------------------------------------*/
/** Function: updatePhembot                                                   */
/** Updates the phembot data from the server.                                 */
/**                                                                           */
/** @param {string} type     The type of list object.                         */
/** @param {number} data     The list data to post.                           */
/**---------------------------------------------------------------------------*/
//function getPhembot(type, id) {
    /**-----------------------------------------------------------------------*/
    /** Set the http options to be used by the request:                       */
    /**-----------------------------------------------------------------------*/
//    var options = {
//       host: config.host,
//       port: config.port,
//       method: 'GET',
//       path: '/phembot/list/' + type + '/id/' + id
//    };

    /**-----------------------------------------------------------------------*/
    /** Define the callback function used to deal with the response:          */
    /**-----------------------------------------------------------------------*/
//    var callback = function (response) {
        /**-------------------------------------------------------------------*/
        /** Continuously update the stream with data as it arrives:           */
        /**-------------------------------------------------------------------*/
//        var body = '';
//        response.on('data', function(data) {
//            body += data;
//        });

        /**-------------------------------------------------------------------*/
        /** The data has been received completely:                            */
        /**-------------------------------------------------------------------*/
//        response.on('end', function() {
            /**---------------------------------------------------------------*/
            /** If a phembot and task due notifications are required then     */
            /**---------------------------------------------------------------*/
//            var data = JSON.parse(body);
//            console.log(data);
//        });
//    }
//}


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
//        var socket = new io.Socket();
