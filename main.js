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
var util = require('./util');
var List = require("./lib/list.js");

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from other node packages:         */
/**---------------------------------------------------------------------------*/
const ipcRenderer = require('electron').ipcRenderer; // Inter-process communication
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
var shell = require('shelljs');
var xml2js = require('xml2js');
var watch = require('watch');
//var chokidar = require('chokidar');
var socket = require('socket.io');

/**---------------------------------------------------------------------------*/
/** Define a global object variable to store the application context for this */
/** session:                                                                  */
/**---------------------------------------------------------------------------*/
var appContext = {};
var listObj = {};

/**---------------------------------------------------------------------------*/
/** Declare global program variables:                                         */
/**---------------------------------------------------------------------------*/
var armedRoll = true;
var armedUnroll = false;
var lastdynamic;
var currentView;
var rule = {};

/******************************************************************************/
/**                                                                           */
/** STARTUP   STARTUP   STARTUP   STARTUP   STARTUP   STARTUP   STARTUP       */
/**                                                                           */
/** User logged in and returned user context data from the server:            */
/******************************************************************************/
ipcRenderer.on('appContext', function(event, context) {
    /**-----------------------------------------------------------------------*/
    /** Get the pdca list data from the server now we have the server address:*/
    /**-----------------------------------------------------------------------*/
    appContext = JSON.parse(context);
    currentView = appContext.startView;
    getListMainPage(currentView, 0, true);
    getListMainPage('do', 0, true);
    getListMainPage('plan', 0, false);
    getListMainPage('check', 0, true);
    getListMainPage('act', 0, true);
    getListMainPage('list', 0, false);

    /**-----------------------------------------------------------------------*/
    /** Default the master and working list toggle to visible for both:       */
    /**-----------------------------------------------------------------------*/
    appContext.visibleMaster = true;
    appContext.visibleWorking = true;

    /**-----------------------------------------------------------------------*/
    /** Module: node-schedule                                                 */
    /** Periodically runs to refresh the data display.                        */
    /** schedule.scheduleJob('30 * * * * *', function(){  //cron style        */
    /**                                                                       */
    /** Set a new rule to run when the clock second hand is at 0 and also at  */
    /** 30, which is every 30 seconds or two times per minute. Fast enough:   */
    /**-----------------------------------------------------------------------*/
    rule = new schedule.RecurrenceRule();
    rule.second = [0];
    //rule.second = [0, 30];

    /**-----------------------------------------------------------------------*/
    /** Schedule a job on the 30 second rule to update the main dfp window    */
    /** lists:                                                                */
    /**-----------------------------------------------------------------------*/
    schedule.scheduleJob(rule, function(){
        getListMainPage('do', 0, true);
        getListMainPage('plan', 0, false);
        getListMainPage('check', 0, true);
        getListMainPage('act', 0, true);
        getListMainPage('list', 0, false);
    });

    // Initialize watcher.
//    var watcher = chokidar.watch('file, dir, glob, or array', {
//        ignored: /[\/\\]\./,
//        persistent: true
//    });


    // Initialize watcher.
/*
    chokidar.watch('.').on('all', function(event, path) {
    });
    var watcher = chokidar.watch('.', {
        persistent: true
    });

    watcher.on('add', function(path) {
        console.log('File ' + path + ' has been added'); 
        fs.readFile(path, 'utf8', function(err, data) {
            if (err) {
                console.log(err);
            }
            else {
                var obj = JSON.parse(data);
                console.log('posting list ' + path);
                postData('list', obj);
            }
        });
    });
*/

    /**-----------------------------------------------------------------------*/
    /** Module: watch                                                         */
    /** Monitor the local file store for any changes.                         */
    /**                                                                       */
    /** Setup the fs.watch object to monitor the local files directory.       */
    /**-----------------------------------------------------------------------*/
    var watchPath = appContext.user.profiles[appContext.startProfile].pathLocal + '/' + 
                    appContext.user.pathLocalReceptorsIn;
    watch.watchTree(watchPath, function (f, curr, prev) {
        /**-------------------------------------------------------------------*/
        /** Assume there will be nothing to do:                               */
        /**-------------------------------------------------------------------*/
        var msg;
        var processWatchedFile = false;

        /**-------------------------------------------------------------------*/
        /** Check if finished walking the directory tree.                     */
        /**-------------------------------------------------------------------*/
        if (typeof f == 'object' && prev === null && curr === null) {
            /**---------------------------------------------------------------*/
            /** Nothing more to do:                                           */
            /**---------------------------------------------------------------*/
        }

        /**-------------------------------------------------------------------*/
        /** Process any new file:                                             */
        /**-------------------------------------------------------------------*/
        else if (prev === null) {
            processWatchedFile = true;
            msg = 'Detected new file'
        }

        /**-------------------------------------------------------------------*/
        /** Check if the file was removed:                                    */
        /**-------------------------------------------------------------------*/
        else if (curr.nlink === 0) {
            /**---------------------------------------------------------------*/
            /** Just forget about it:                                         */
            /**---------------------------------------------------------------*/
            console.log('file was removed ' + f);
        }
        else {
            /**---------------------------------------------------------------*/
            /** The file was changed in some way. Better process it:          */
            /**---------------------------------------------------------------*/
            processWatchedFile = true;
            msg = 'Detected changed file'
        }

        /**-------------------------------------------------------------------*/
        /** Process the file if it is new or changed:                         */
        /**-------------------------------------------------------------------*/
        if (processWatchedFile) {
            /**---------------------------------------------------------------*/
            /** Show a random animation:                                      */
            /**---------------------------------------------------------------*/
            processFile(f, msg);
        }
    });
});

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

    /**-----------------------------------------------------------------------*/
    /** Update the list filter:                                               */
    /**-----------------------------------------------------------------------*/
    var listName = type + '-list';
    var filterName = type + '-filter';
    var parentName = type + '-parent';
    var options = {
        valueNames: [ 'info', 'desc' ],
        listClass: listName,
        searchClass: filterName
    };
    var filterList = new List(parentName, options);

    /**-----------------------------------------------------------------------*/
    /** Check if the master or working lists in which case can now add the    */
    /** label click events after rendering:                                   */
    /**-----------------------------------------------------------------------*/
    if (type === 'list') {
        /**-------------------------------------------------------------------*/
        /** Master list filter click event to toggle the master list display: */
        /**-------------------------------------------------------------------*/
        document.getElementById('list-img-master').addEventListener('click', toggleMaster);
        document.getElementById('text-img-master').addEventListener('click', toggleMaster);

        /**-------------------------------------------------------------------*/
        /** Working list filter click event to toggle the working list        */
        /** display:                                                          */
        /**-------------------------------------------------------------------*/
        document.getElementById('list-img-working').addEventListener('click', toggleWorking);
        document.getElementById('text-img-working').addEventListener('click', toggleWorking);
    }

    /**-----------------------------------------------------------------------*/
    /** Kludge for windows display needing extra 2 pixels:                    */
    /**-----------------------------------------------------------------------*/
    if (appContext.startProfile === 'win32' || appContext.startProfile === 'win64') {
        document.getElementById(type + '-content').style.width = '367px';
    }


    /**-----------------------------------------------------------------------*/
    /** Set the number of items in the pending text so the user knows to      */
    /** scroll for more:                                                      */
    /**-----------------------------------------------------------------------*/
    var numItems = 0;
    data[type].forEach(function () {
        numItems++;
    });
    document.getElementById(type + '-pending').innerHTML = 
        '<p><a href="" target="_blank">Scroll for total of ' + 
        numItems + ' items</a></p>';

    /**-----------------------------------------------------------------------*/
    /** Revert to the current context display:                                */
    /**-----------------------------------------------------------------------*/
    setDisplayView(currentView);

    /**-----------------------------------------------------------------------*/
    /** Save the object array in the global variable:                         */
    /**-----------------------------------------------------------------------*/
    listObj[type] = data[type];
}

/**---------------------------------------------------------------------------*/
/** Function: Object.size                                                     */
/** Gets the size of the data object.                                         */
/**---------------------------------------------------------------------------*/
/*
var numItems = Object.size(data);
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
*/

/**---------------------------------------------------------------------------*/
/** Function: toggleMaster                                                    */
/** Toggles the Master list display filter.                                   */
/**---------------------------------------------------------------------------*/
function toggleMaster() {
    appContext.visibleMaster = !appContext.visibleMaster;
    if (appContext.visibleMaster) {
        document.getElementById('list-img-master').style.backgroundImage = 
            'url(./images/master.png)';
    }
    else {
        document.getElementById('list-img-master').style.backgroundImage = 
            'url(./images/master-off.png)';
    }
    filterMWList();
};

/**---------------------------------------------------------------------------*/
/** Function: toggleWorking                                                   */
/** Toggles the Working list display filter.                                  */
/**---------------------------------------------------------------------------*/
function toggleWorking() {
    appContext.visibleWorking = !appContext.visibleWorking;
    if (appContext.visibleWorking) {
        document.getElementById('list-img-working').style.backgroundImage = 
            'url(./images/working.png)';
    }
    else {
        document.getElementById('list-img-working').style.backgroundImage = 
            'url(./images/working-off.png)';
    }
    filterMWList();
};

/**---------------------------------------------------------------------------*/
/** Function: filterMWList                                                    */
/** Filters the Master and Working list display based on the toggle selection.*/
/**---------------------------------------------------------------------------*/
function filterMWList() {
    /* creating the empty array for storing the options */
//    var ost=[];

    /* storing the options in the ost array for future use */
/*
    function store(){
        var opts=document.getElementById('lb').options;
        for(var k=0; k<opts.length; k++){
            var temp=[opts[k].text,opts[k].value];ost.push(temp);
        }
        doc('pattern').focus();
        doc('btn1').onclick=get_options;
    }
*/
     
//    function get_options(){
        /* getting the input value */
//        var val=document.getElementById('pattern').value;

        /* if the input value length < 1 (it's empty) stopping the function */
//        if(val.length<1){
//            return;
//        }
        /* if the input value is not empty */
//        var opts=document.getElementById('lb').options;
        /* removing all the options from the select (we already have them all stored in the ost array) */
//        opts.length=0;
        /* looping through the ost array comparing each member[0] (which is an option text) with the given value */
//        for(var i in ost) {
            /* if the current member[0] contains a substring of the given value, we add a new option to the select element
            creating it from the current member[0] as the option text and current member[1] as the option value */
//            if(ost[i][0].indexOf(val)!=-1){
//                var o=new Option(ost[i][0],ost[i][1]);opts.add(o);
//            }
            /* otherwise skip this member and continue the loop */
//            else{continue;}
//        }
        /* if none of the ost members[0] has the given value,
        adding an option with text='nothing found' and value='' */
//        if(opts.length==0){
//            var o = new Option('nothing found','');opts.add(o);
//        }
//    };
    /* storing the select element options onload */
//    window.onload=store;
};

/**---------------------------------------------------------------------------*/
/** Register the helper to calculate the height of the duration bar:          */
/**---------------------------------------------------------------------------*/
Handlebars.registerHelper('styleDuration', function(duration) {
    if (typeof duration === 'undefined' || duration === 0) {
        var styleDuration = 'height: 0px;'; 
    }
    else if (duration <= 2) {
        var styleDuration = 'height: 10px; background-color: #3181e7'; 
    }
    else if (duration <= 5) {
        var styleDuration = 'height: 20px; background-color: #3293f9'; 
    }
    else if (duration <= 10) {
        var styleDuration = 'height: 30px; background-color: #3295fb'; 
    }
    else if (duration <= 15) {
        var styleDuration = 'height: 40px; background-color: #33397fd'; 
    }
    else {
        var styleDuration = 'height: 50px; background-color: #3399ff'; 
    }
    return styleDuration;
});

/**---------------------------------------------------------------------------*/
/** Register the helper to calculate the width of the time elapsed bar:       */
/**---------------------------------------------------------------------------*/
Handlebars.registerHelper('styleElapsed', function(duration, elapsed, remaining) {
    if (typeof duration === 'undefined' || typeof elapsed === 'undefined' || remaining === 'undefined') {
        var styleElapsed = 'width: 0px;';
    }
    else if (isNaN(Number(duration)) || isNaN(Number(elapsed)) || isNaN(Number(remaining))) {
        var styleElapsed = 'width: 0px;';
    }
    else {
        var widthElapsed = 340 * Number(elapsed) / (Number(elapsed) + Number(remaining));
        var styleElapsed = 'width: ' + widthElapsed + 'px;';
        if (Number(elapsed) + Number(remaining) < Number(duration)) {
            var styleElapsed = styleElapsed + ' background-color: #116811'; 
        }
        else {
            var styleElapsed = styleElapsed + ' background-color: #681111'; 
        }
    }
    return styleElapsed;
});

/**---------------------------------------------------------------------------*/
/** Register the helper to calculate the width of the time remaining bar:     */
/**---------------------------------------------------------------------------*/
Handlebars.registerHelper('styleRemaining', function(duration, elapsed, remaining) {
    if (typeof elapsed === 'undefined' || remaining === 'undefined') {
        var styleRemaining = 'width: 0px;';
    }
    else if (isNaN(Number(elapsed)) || isNaN(Number(remaining))) {
        var styleRemaining = 'width: 0px;';
    }
    else {
        var widthRemaining = 340 * Number(remaining) / (Number(elapsed) + Number(remaining));
        var styleRemaining = 'width: ' + widthRemaining + 'px;';
        if (Number(elapsed) + Number(remaining) < Number(duration)) {
            var styleRemaining = styleRemaining + ' background-color: #228a22'; 
        }
        else {
            var styleRemaining = styleRemaining + ' background-color: #8a2222'; 
        }
    }
    return styleRemaining;
});

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
ipcRenderer.on('render-finished', function() {
});

/**---------------------------------------------------------------------------*/
/** Main window has been rolled up:                                           */
/**---------------------------------------------------------------------------*/
ipcRenderer.on('rolled', function() {
    document.getElementById("roll-wrap").style.display = 'block';
    document.getElementById("roll-wrap").classList.add('activeRoll');
//    document.getElementById("roll-wrap").addEventListener('mouseover', unrollFunction, false);
});

/**---------------------------------------------------------------------------*/
/** Main window has been unrolled:                                            */
/**---------------------------------------------------------------------------*/
ipcRenderer.on('unrolled', function() {
    document.getElementById("roll-wrap").style.display = 'none';
    document.getElementById("roll-wrap").classList.remove('activeRoll');
//    document.addEventListener('mouseleave', rollFunction, false);
});

var rollFunction = function (e) {
//    document.removeEventListener('mouseleave', rollFunction, false);
    ipcRenderer.send('doRoll');
};



var unrollFunction = function (e) {
//    document.getElementById("roll-wrap").removeEventListener('mouseover', unrollFunction, false);
    ipcRenderer.send('doUnroll');

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
    /** Hide the menu if not a search icon or search box click event:         */
    /**-----------------------------------------------------------------------*/
    if (el.id !== 'search-key' && el.id !== 'search-icon') {
        document.getElementById('hamburger').classList.remove("is-active");
        document.getElementById("icon-menu").style.display = 'none';
        hideSlide(el);
    }

    /**-----------------------------------------------------------------------*/
    /** Get the target of the html object and check it is valid. The list     */
    /** items have their object type and id as the href target attribute:     */
    /**-----------------------------------------------------------------------*/
    var ref = el.target;
    if (!ref) return;
    console.log(ref);

    /**-----------------------------------------------------------------------*/
    /** Get the location of the 'underscore' character which separates the    */
    /** list item type and id or name:                                        */
    /**-----------------------------------------------------------------------*/
    var delimChar = ref.indexOf("_");
    var type = ref.substring(0, delimChar)
    var typeRef = ref.substring(delimChar + 1);

    /**-----------------------------------------------------------------------*/
    /** Check if this is from the list tab for the catalog of master and      */
    /** working data lists:                                                   */
    /**-----------------------------------------------------------------------*/
    if (type === 'list') {
        /**-------------------------------------------------------------------*/
        /** Get the catalog list name and the full list data from the backend */
        /** API. Send it to the renderer side:                                */
        /**-------------------------------------------------------------------*/
        ipcRenderer.send('datatable', typeRef);
    }

    /**-----------------------------------------------------------------------*/
    /** Check if this is from the phembot task list:                          */
    /**-----------------------------------------------------------------------*/
    else if (type === 'listPlan' || type === 'listDo' || 
             type === 'listCheck' || type === 'listAct') {
        /**-------------------------------------------------------------------*/
        /** Convert to the object array type:                                 */
        /**-------------------------------------------------------------------*/
        type = type.substr(4).toLowerCase();

        /**-------------------------------------------------------------------*/
        /** Get the updated phembot and and display the details:              */
        /**-------------------------------------------------------------------*/
        if (type !== 'listPlan') {
            document.getElementById(typeRef + '_duration').style.backgroundColor = '#ffffff';
        }
        for (var i = 0; i < listObj[type].length; i++) {
            if (listObj[type][i]._id === typeRef) {
                console.log(listObj[type][i]);
                ipcRenderer.send('phembot', listObj[type][i]);
            }
        };
    }
    else {
        /**-------------------------------------------------------------------*/
        /** What to do:                                                       */
        /**-------------------------------------------------------------------*/
        console.log('type ' + type + ' ref ' + typeRef);
        ipcRenderer.send('unhandled body click');
    }
});

/**---------------------------------------------------------------------------*/
/** Find matching array element:                                              */
/**---------------------------------------------------------------------------*/
function arrayPos(arr, obj) {
    var j = -1;
    for(var i = 0; i < arr.length; i++) {
        if (arr[i] == obj) { 
            j = i;
        }
    }
    return j;
    // return (arr.indexOf(obj) != -1);
}

/**---------------------------------------------------------------------------*/
/** Act label event. Used to display the act selection box on the dfp         */
/** window:                                                                   */
/**---------------------------------------------------------------------------*/
document.getElementById('act-label').addEventListener('click', function() {
    setDisplayView('act');
})

/**---------------------------------------------------------------------------*/
/** Menu cart icon event. Used to render the ipoogi document store in the     */
/** user's main browser:                                                      */
/**---------------------------------------------------------------------------*/
document.getElementById('cart-icon').addEventListener('click', function(e) {
    openExternal(e, 'docstore');
})

/**---------------------------------------------------------------------------*/
/** Menu calender icon event. Used to render the new calendar window:         */
/**---------------------------------------------------------------------------*/
document.getElementById('cal-icon').addEventListener('click', function(e) {
    openExternal(e, 'calendar');
})

/**---------------------------------------------------------------------------*/
/** Menu chat icon event. Used to render the chat window:                     */
/**---------------------------------------------------------------------------*/
document.getElementById('chat-icon').addEventListener('click', function(e) {
    openExternal(e, 'chat');
})

/**---------------------------------------------------------------------------*/
/** Check label event. Used to display the check content:                     */
/**---------------------------------------------------------------------------*/
document.getElementById('check-label').addEventListener('click', function() {
    setDisplayView('check');
})

/**---------------------------------------------------------------------------*/
/** Menu dashboard icon click event. Used to render the new dashboard window: */
/**---------------------------------------------------------------------------*/
document.getElementById('dash-icon').addEventListener('click', function(e) {
    openExternal(e, 'dashboard');
})

/**---------------------------------------------------------------------------*/
/** Do label click event. Used to display the phembot list:                   */
/**---------------------------------------------------------------------------*/
document.getElementById('do-label').addEventListener('click', function() {
    setDisplayView('do');
})

/**---------------------------------------------------------------------------*/
/** Dynamic content click event. Used to reset the dyno display:              */
/** TODO: Display dyno display options... get more content:                   */
/**---------------------------------------------------------------------------*/
document.getElementById('dyno').addEventListener('click', function() {
    /**-----------------------------------------------------------------------*/
    /** For now just reset the dynamic image:                                 */
    /**-----------------------------------------------------------------------*/
    document.getElementById('dyno').style.backgroundImage = 'url(./images/spiral-static.png)';
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
  console.log('drag enter');
});

document.getElementById('dyno').addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
});

/**---------------------------------------------------------------------------*/
/** Process the drop event based on what was dropped on the dyno:             */
/**---------------------------------------------------------------------------*/
document.getElementById('dyno').addEventListener('drop', function(e) {
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
    /** Show a random animation:                                              */
    /**-----------------------------------------------------------------------*/
    var msg = 'Analysing dropped files';

    /**-----------------------------------------------------------------------*/
    /** Enter a loop to process all of the files:                             */
    /**-----------------------------------------------------------------------*/
    for (var i = 0; i < files.length; i++) {
        processFile(files[i].path, msg);
    }
});

/**---------------------------------------------------------------------------*/
/** Menu dashboard icon click event. Used to render the new dashboard window: */
/**---------------------------------------------------------------------------*/
document.getElementById('filter-clear').addEventListener('click', function(e) {
    document.getElementById('filter-key').value = "";
    updateSlaveFilters("");
})

/**---------------------------------------------------------------------------*/
/** Getting started guid click event to open online guide:                    */
/**---------------------------------------------------------------------------*/
document.getElementById('getting-started').addEventListener('click', function(e) {
    openExternal(e, 'getting-started');
})

/**---------------------------------------------------------------------------*/
/** Hamburger menu to display or hide main menu:                              */
/**---------------------------------------------------------------------------*/
document.getElementById('hamburger').addEventListener('mouseenter', function(e) {
    e.preventDefault();
    var h = document.getElementById('hamburger');
    if (h.classList.contains("is-active")) {
    }
    else {
        h.classList.add("is-active");
        document.getElementById('icon-menu').style.display = 'block';
    }
});

document.getElementById('hamburger').addEventListener('click', function(e) {
    e.preventDefault();
    var h = document.getElementById('hamburger');
    if (h.classList.contains("is-active")) {
        h.classList.remove("is-active")
        document.getElementById('icon-menu').style.display = 'none';
        hideSlide(document.getElementById("slide"));
    }
    else {
        h.classList.add("is-active");
        document.getElementById('icon-menu').style.display = 'block';
    }
});

/**---------------------------------------------------------------------------*/
/** Hide menu icon event to hide the main window. Must be re-shown via the    */
/** task bar icon callback event:                                             */
/**---------------------------------------------------------------------------*/
document.getElementById('hide-icon').addEventListener('click', function(e) {
    openExternal(e, 'hideMain');
})

/**---------------------------------------------------------------------------*/
/** Menu learn icon event. Used to render the learning window:                */
/**---------------------------------------------------------------------------*/
document.getElementById('learn-icon').addEventListener('click', function(e) {
    /**-----------------------------------------------------------------------*/
    /** Toggle the label display and send the event to the renderer process:  */
    /**-----------------------------------------------------------------------*/
    e.stopPropagation();
    document.getElementById('hamburger').classList.remove("is-active");
    document.getElementById("icon-menu").style.display = 'none';
    hideSlide(document.getElementById("slide"));
    ipcRenderer.send('learning','index');
})

/**---------------------------------------------------------------------------*/
/** List label event. Used to display the master and working list catalog:    */
/**---------------------------------------------------------------------------*/
document.getElementById('list-label').addEventListener('click', function() {
    setDisplayView('list');
})

/**---------------------------------------------------------------------------*/
/** Application logout icon click event to lot out the user and show the      */
/** login dialog again:                                                       */
/**---------------------------------------------------------------------------*/
document.getElementById('logout-icon').addEventListener('click', function(e) {
    openExternal(e, 'logout');
});

/**---------------------------------------------------------------------------*/
/** Plan label click event. Used to display the QA plan (list):               */
/**---------------------------------------------------------------------------*/
document.getElementById('plan-label').addEventListener('click', function() {
    setDisplayView('plan');
})

/**---------------------------------------------------------------------------*/
/** Preferences icon event. Used to display the settings screen:              */
/**---------------------------------------------------------------------------*/
document.getElementById('prefs-icon').addEventListener('click', function(e) {
    openExternal(e, 'userPreferences');
});

/**---------------------------------------------------------------------------*/
/** Application quit icon click event to close the application by sending the */
/** event to the renderer process to close down gracefully:                   */
/**---------------------------------------------------------------------------*/
document.getElementById('quit-icon').addEventListener('click', function(e) {
    openExternal(e, 'quit');
});

/**---------------------------------------------------------------------------*/
/** Application quit and logout menu click event:                             */
/**---------------------------------------------------------------------------*/
document.getElementById('quit-icon-menu').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('exit-menu').style.display = 'block';
});

/**---------------------------------------------------------------------------*/
/** Search icon event to show the search slider box:                          */
/**---------------------------------------------------------------------------*/
document.getElementById('search-icon').addEventListener('click', function(e) {
    /**-----------------------------------------------------------------------*/
    /** Toggle the search slider box display:                                 */
    /**-----------------------------------------------------------------------*/
    e.stopPropagation();
    document.getElementById('exit-menu').style.display = 'none';
    var el = document.getElementById('slide');
    console.log(el.id);
    console.log(el.style.display);
    if (el.style.display === '' || el.style.display === 'none') {
        el.style.display = 'block';
        dynamics.animate(
            el,
                {
                translateX: -260
            },
                {
                type: dynamics.spring,
                frequency: 200,
                friction: 200,
                duration: 1000
            }
        )
    }
    else {
        hideSlide(el);
    }
});

function hideSlide(el) {
    document.getElementById('exit-menu').style.display = 'none';
    if (el.style.display === 'block') {
        dynamics.animate(
            el,
                {
                translateX: +260
            },
                {
                type: dynamics.spring,
                frequency: 100,
                friction: 100,
                duration: 100
            }
        )
        el.style.display = 'none';
    }
}

/**---------------------------------------------------------------------------*/
/** Search box selection click event:                                         */
/**---------------------------------------------------------------------------*/
document.getElementById('search-key').addEventListener('keyup', function(e) {
    /**-----------------------------------------------------------------------*/
    /** Get the search text if enter is pressed:                              */
    /**-----------------------------------------------------------------------*/
    if (e.keyCode === 13) {
        e.preventDefault();
        var searchText = document.getElementById('search-key').value;
        ipcRenderer.send('learning', searchText);
    }
});

/**---------------------------------------------------------------------------*/
/** Filter box key press event to filter all pdca lists:                      */
/**---------------------------------------------------------------------------*/
document.getElementById('filter-key').addEventListener('keyup', function(e) {
    /**-----------------------------------------------------------------------*/
    /** Get the filter text value:                                            */
    /**-----------------------------------------------------------------------*/
    e.preventDefault();
    var filterText = document.getElementById('filter-key').value;
    updateSlaveFilters(filterText);
});

function updateSlaveFilters(filterText) {
    /**-----------------------------------------------------------------------*/
    /** Enter a loop to process all filter class elements:                    */
    /**-----------------------------------------------------------------------*/
    var elements = document.getElementsByClassName('filter-slave');
    for (var i = 0; i < elements.length; i++) {
        /**-------------------------------------------------------------------*/
        /** Set the filter class element text:                                */
        /**-------------------------------------------------------------------*/
        elements[i].value = filterText;

        /**-------------------------------------------------------------------*/
        /** Invoke the key press event to force the updated filter value to   */
        /** be used by list.js:                                               */
        /**-------------------------------------------------------------------*/
        var eventTrigger = document.createEvent("HTMLEvents");
        eventTrigger.initEvent("keyup", true, true);
        elements[i].dispatchEvent(eventTrigger);
    }
}

/**---------------------------------------------------------------------------*/
/** User icon click event. Used to display the user profile and login details.*/
/**---------------------------------------------------------------------------*/
document.getElementById('user-icon').addEventListener('click', function(e) {
    openExternal(e, 'userProfile');
});

/**---------------------------------------------------------------------------*/
/** Online user manual click event:                                           */
/**---------------------------------------------------------------------------*/
document.getElementById('user-manual').addEventListener('click', function(e) {
    openExternal(e, 'user-manual');
})

/**---------------------------------------------------------------------------*/
/** Function: openExternal                                                    */
/** Opens an external window by passing the specified event to ipcRenderer.   */
/**                                                                           */
/** @param {object} e        The element which received the event.            */
/** @param {string} ipcEvent The event name to pass to the renderer via ipc.  */
/**---------------------------------------------------------------------------*/
function openExternal(e, ipcEvent) {
    e.stopPropagation();
    document.getElementById('hamburger').classList.remove("is-active");
    document.getElementById("icon-menu").style.display = 'none';
    document.getElementById('exit-menu').style.display = 'none';
    hideSlide(document.getElementById("slide"));
    ipcRenderer.send(ipcEvent);
}

/**---------------------------------------------------------------------------*/
/** Function: setDisplayView                                                  */
/** Sets the display of the application by showing or hiding things.          */
/**                                                                           */
/** @param {string} context  The application display context name.            */
/**---------------------------------------------------------------------------*/
function setDisplayView(view) {
    /**-----------------------------------------------------------------------*/
    /** Save the current context so that we can reset it after re-render:     */
    /**-----------------------------------------------------------------------*/
    currentView = view;

    /**-----------------------------------------------------------------------*/
    /** Reset all the labels to set the active one later:                     */
    /**-----------------------------------------------------------------------*/
    document.getElementById("plan-label").classList.remove('activeLabel');
    document.getElementById("do-label").classList.remove('activeLabel');
    document.getElementById("check-label").classList.remove('activeLabel');
    document.getElementById("act-label").classList.remove('activeLabel');
    document.getElementById("list-label").classList.remove('activeLabel');

    /**-----------------------------------------------------------------------*/
    /** Hide everything in the top part as not just a dyno change:            */
    /**-----------------------------------------------------------------------*/
    document.getElementById('hamburger').classList.remove("is-active");
    document.getElementById('icon-menu').style.display = 'none';
    if (document.getElementById('plan-parent')) {
        document.getElementById('plan-parent').style.display = 'none';
    }
    if (document.getElementById('do-parent')) {
        document.getElementById('do-parent').style.display = 'none';
    }
    if (document.getElementById('check-parent')) {
        document.getElementById('check-parent').style.display = 'none';
    }
    if (document.getElementById('act-parent')) {
        document.getElementById('act-parent').style.display = 'none';
    }
    if (document.getElementById('list-parent')) {
        document.getElementById('list-parent').style.display = 'none';
    }
    hideSlide(document.getElementById("slide"));

    /**-----------------------------------------------------------------------*/
    /** Process according to display context:                                 */
    /**-----------------------------------------------------------------------*/
    switch (view) {
        /**-------------------------------------------------------------------*/
        /** Improvement selection options when "Act" label is clicked:        */
        /**-------------------------------------------------------------------*/
        case ('act'):
            document.getElementById("act-label").classList.add('activeLabel');
            if (document.getElementById('act-parent')) {
                document.getElementById('act-parent').style.display = 'block';
            }
            break;

        /**-------------------------------------------------------------------*/
        /** Check selection options when "Check" label is clicked:            */
        /**-------------------------------------------------------------------*/
        case ('check'):
            document.getElementById("check-label").classList.add('activeLabel');
            if (document.getElementById('check-parent')) {
                document.getElementById('check-parent').style.display = 'block';
            }
            break;

        /**-------------------------------------------------------------------*/
        /** Phembot task list when "Task" label is clicked:                   */
        /**-------------------------------------------------------------------*/
        case ('do'):
            document.getElementById("do-label").classList.add('activeLabel');
            if (document.getElementById('do-parent')) {
                document.getElementById('do-parent').style.display = 'block';
            }
            break;

        /**-------------------------------------------------------------------*/
        /** Catalog of master and working lists when "List" label is clicked: */
        /**-------------------------------------------------------------------*/
        case ('list'):
            document.getElementById("list-label").classList.add('activeLabel');
            if (document.getElementById('list-parent')) {
                document.getElementById('list-parent').style.display = 'block';
            }
            break;

        /**-------------------------------------------------------------------*/
        /** List of Quality Controls when the Quality Assurance Plan label    */
        /** is clicked:                                                       */
        /**-------------------------------------------------------------------*/
        case ('plan'):
            document.getElementById("plan-label").classList.add('activeLabel');
            if (document.getElementById('plan-parent')) {
                document.getElementById('plan-parent').style.display = 'block';
            }
            break;

        default:
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
/** @param {number} name     The list name.                                   */
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
        case ('act'):
            uri = '/list/listAct/' + num;
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
        /** Master and working lists:                                         */
        /**-------------------------------------------------------------------*/
        case ('list'):
            uri = '/catalogLists';
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
    /** Set an anchor to the page url to use link.hostname and link.port:     */
    /**-----------------------------------------------------------------------*/
//    var url = window.location.href
//    var link = document.createElement('a');
//    link.setAttribute('href', url);

    /**-----------------------------------------------------------------------*/
    /** Set the http options to be used by the request:                       */
    /**-----------------------------------------------------------------------*/
    var options = {
       host: appContext.serverConfig.host,
       port: appContext.serverConfig.port,
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
            /** Get the data from the server based on the requested type:     */
            /**---------------------------------------------------------------*/
            var data = {};
            data[type] = JSON.parse(body);
            
            /**---------------------------------------------------------------*/
            /** Check if a phembot which requires action:                     */
            /**---------------------------------------------------------------*/
            if (type !== 'list') {
                /**-----------------------------------------------------------*/
                /** Enter a loop to add the user data to each phembot:        */
                /**-----------------------------------------------------------*/
                data[type].forEach(function (obj) {
                    obj.user = {};
                    obj.user = appContext.user;
                    obj.user.pathLocal = appContext.user.profiles[appContext.startProfile].pathLocal;
                    obj.user.pathRemote = appContext.user.profiles[appContext.startProfile].pathRemote;
                    obj.user.pathSheet = appContext.user.profiles[appContext.startProfile].pathSheet;
                    obj.user.pathWrite = appContext.user.profiles[appContext.startProfile].pathWrite;
                });
            }

                    /**-------------------------------------------------------*/
                    /** If task due notifications are required then check if  */
                    /** any phembots are due soon and require an OS native    */
                    /** notification message:                                 */
                    /** TODO: Won't work with limited list. Need separate API */
                    /** call for pending phembots regardless of how many:     */
                    /**-------------------------------------------------------*/
//                    if (notify) {
//                        createNotification(arr[i]);
//                    }
//                }

            /**---------------------------------------------------------------*/
            /** Render the handlebars templates with the new object data:     */
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
//            ipcRenderer.send('datatable', name);
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
    /** Set the API URI to post the data to according to the data type:       */
    /**-----------------------------------------------------------------------*/
    switch(type) {
        case 'phembot':
            var uriServer = '/phembot';
            break;

        case 'list':
            var uriServer = '/list/' + obj.listInfo.name;
            break;

        case 'refDoc':
            var uriServer = '/refDoc/' + obj.root.name;
            break;
    }

    /**-----------------------------------------------------------------------*/
    /** Set the HTTP information:                                             */
    /**-----------------------------------------------------------------------*/
    var body = JSON.stringify(obj);
    var options = {
        uri: 'http://' + appContext.serverConfig.host + ':' + 
                         appContext.serverConfig.port + uriServer,
        method: 'POST',
        headers: {},
        body: body
    };

    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(body);

    /**-----------------------------------------------------------------------*/
    /** Send the HTTP request:                                                */
    /**-----------------------------------------------------------------------*/
    request.post(options, function (error, response, body) {
        if (error) {
            console.log(error);
        }

        /**-------------------------------------------------------------------*/
        /** Request was successfully completed:                               */
        /**-------------------------------------------------------------------*/
        else if (!error && response.statusCode == 200) {
            console.log(body);
            stopAnimation();
        }

        /**-------------------------------------------------------------------*/
        /** The request has been fulfilled and resulted in a new resource     */
        /** being created. That would be the list of known phembots which     */
        /** are capable of handling the dropped artifact:                     */
        /**-------------------------------------------------------------------*/
        else if (response.statusCode == 201) {
            /**---------------------------------------------------------------*/
            /** Response indicates there is more to display. Render it:       */
            /**---------------------------------------------------------------*/
            console.log(response.body);
            ipcRenderer.send('phembots', JSON.parse(response.body));
            stopAnimation();
        }
    });
}

/**---------------------------------------------------------------------------*/
/** Event: showAnimation                                                      */
/** Shows a random animation from the video library.                          */
/**---------------------------------------------------------------------------*/
ipcRenderer.on('showAnimation', function(event, msg) {
    showAnimation(msg);
});

function showAnimation(msg) {
    /**-----------------------------------------------------------------------*/
    /** Check if the dyno is already active:                                  */
    /**-----------------------------------------------------------------------*/
    var el = document.getElementById('dyno')
    if (el.classList.contains("dynoInactive")) {
        /**-------------------------------------------------------------------*/
        /** Get the path to the phembot video library:                        */
        /**-------------------------------------------------------------------*/
        var videoPath = appContext.user.profiles[appContext.startProfile].pathRemote + 
                        '/' + appContext.user.pathRemotePhembots + '/videos/';

        /**-------------------------------------------------------------------*/
        /** Get the list of videos and pick one at random to display:         */
        /**-------------------------------------------------------------------*/
        fs.readdir(videoPath, function(err, files) {
            var i = Math.floor(Math.random() * files.length);
            el.style.backgroundImage = 'url(' + videoPath + files[i] + ')';
            el.classList.add('dynoActive');
            el.classList.remove('dynoInactive');
        });
    /*
            var video = document.getElementById('dyno-video');
            video.setAttribute("src", videoPath + files[i]);
            video.load();
            video.style.display = 'block';
    */

        /**-------------------------------------------------------------------*/
        /** Display the status message if there is one:                       */
        /**-------------------------------------------------------------------*/
        if (typeof msg !== 'undefined') {
            var em = document.getElementById('dyno-msg')
            em.style.display = 'block';
            em.innerHTML = msg;
        }
    }
};

/**---------------------------------------------------------------------------*/
/** Event: stopAnimation                                                      */
/** Stops animation of the dyno and returns to static image.                  */
/**---------------------------------------------------------------------------*/
ipcRenderer.on('stopAnimation', function() {
    stopAnimation();
});

function stopAnimation() {
    var el = document.getElementById('dyno')
    el.style.backgroundImage = 'url(./images/spiral-static.png)';
    el.classList.remove('dynoActive');
    el.classList.add('dynoInactive');
    document.getElementById('dyno-msg').style.display = 'none';
//    var video = document.getElementById('dyno-video');
//    video.style.display = 'none';
};

/**---------------------------------------------------------------------------*/
/** Function: processFile                                                     */
/** Process a file based on extension type. Files may come from either a dyno */
/** drop event or from being placed into the watched local directory by hand  */
/** or by a phembot.                                                          */
/**                                                                           */
/** @param {string} f        The file name (and path).                        */
/** @param {string} msg         The message to show above the dyno.           */
/**---------------------------------------------------------------------------*/
function processFile(f, msg) {
    /**-----------------------------------------------------------------------*/
    /** Check if one of the known data types based on the file extension:     */
    /**-----------------------------------------------------------------------*/
    console.log(f);
    var ext = f.substr(f.lastIndexOf('.')+1).toUpperCase();
    if (ext === 'JSON' || ext === 'XML') {
        /**-------------------------------------------------------------------*/
        /** Read the file:                                                    */
        /**-------------------------------------------------------------------*/
        fs.readFile(f, 'utf8', function(err, data) {
            if (err) {
                console.log(err);
            }
            else {
                /**-----------------------------------------------------------*/
                /** Parse the data if a JSON file:                            */
                /**-----------------------------------------------------------*/
                if (ext === 'JSON') {
                    /**-------------------------------------------------------*/
                    /** Parse the JSON data from the file:                    */
                    /**-------------------------------------------------------*/
                    var obj = JSON.parse(data);
                    console.log(JSON.stringify(obj));

                    /**-------------------------------------------------------*/
                    /** Check if a phembot file:                              */
                    /**-------------------------------------------------------*/
                    if (obj.state && obj.status && obj.receptor && obj.sfc && obj.messenger) {
                        console.log('phembot!');
                        executePhembot(obj, msg);
                    }
                    else {
                        /**---------------------------------------------------*/
                        /** Show a random animation:                          */
                        /**---------------------------------------------------*/
                        showAnimation('Sending JSON data to the server');

                        /**---------------------------------------------------*/
                        /** Post the JSON data to the server:                 */
                        /**---------------------------------------------------*/
                        console.log('posting list ' + f);
                        postData('list', obj);
                    }
                }
                else {
                    /**-------------------------------------------------------*/
                    /** Must be an XML file. Convert the data:                */
                    /**-------------------------------------------------------*/
                    showAnimation('Sending XML data to the server');
                    console.log('parsing xml');
                    var parser = new xml2js.Parser();
                    parser.parseString(data, function (err, obj) {
                        console.log('parsed');
                        if (err) {
                            console.log(err)
                        }
                        else {
                            /**-----------------------------------------------*/
                            /** Post the JSON data to the server:             */
                            /**-----------------------------------------------*/
//                            var obj = JSON.parse(result);
                            console.log('posting XML to JSON list ' + f);
                            postData('refDoc', obj);
                        }
                    });
//                    var jsonText = toJson.xmlToJson(data);
                }
            }
        });
    }
    else {
        /**-------------------------------------------------------------------*/
        /** Other file types can only be processed with a phembot to analyse  */
        /** and characterise the file. Set the effector according to the      */
        /** extension but default to Write:                                   */
        /**-------------------------------------------------------------------*/
        var effector;
        switch(ext.toUpperCase()) {
            /**---------------------------------------------------------------*/
            /** Windows office spreadsheet:                                   */
            /**---------------------------------------------------------------*/
            case 'XLS':
            case 'XLSX':
                var effector = 'calc';
                break;

            /**---------------------------------------------------------------*/
            /** Windows office document and all others:                       */
            /**---------------------------------------------------------------*/
            case 'DOC':
            case 'DOCM':
            case 'DOCX':
            default:
                effector = 'write';
                break;
        }

        /**-------------------------------------------------------------------*/
        /** Create the phembot to analyse and identify the dropped document:  */
        /**-------------------------------------------------------------------*/
        var phembot = {
            'state': 'play',
            'activity': 'drop',
            'status': 'play',
            'initiate': 'manual',
            'list': 'listDo',
            'name': 'drop',
            'ref': 'drop',
            'type': 'drop',
            'title': 'Drop handler to characterise document',
            'description': 'Drop handler to characterise document',
            'icon': 'drop.png',
            'receptor': {
                'idCollection': '',
                'idDocument': '',
                'idPhembot': '',
                'ref': 'drop',
                'version': 1,
                'title': 'Drop handler',
                'document': f
            },
            'task': {},
            'sfc': {
                'listPlan': {},
                'listDo': {
                    'numsteps': 1,
                    'curstep': 0,
                    'step': [
                        { 
                            'stp': 1,
                            'name': 'gid'
                        }
                    ],
                    'transition': []
                },
                'listCheck': {},
                'listAct': {}
            },
            'messenger': {
                'gid': {
                    'title': 'Characterise document',
                    'type': 'desktopDocument',
                    'effector': effector,
                    'userConfirm': false,
                    'save': false,
                    'close': true,
                    'request': {},
                    'response': {},
                    'error': {}
                }
            },
            'user': appContext.user,
            'error': {
                'number': 0,
                'procedure': '',
                'message': '',
                'parameters': []
            }
        }

        /**-------------------------------------------------------------------*/
        /** Write the phembot file to the file system and execute it:         */
        /**-------------------------------------------------------------------*/
        var msg = 'Analysing and characterising file';
        executePhembot(phembot, msg);
    }
};

/**---------------------------------------------------------------------------*/
/** Event: showAnimation                                                      */
/** Shows a random animation from the video library.                          */
/**---------------------------------------------------------------------------*/
ipcRenderer.on('executePhembot', function(event, msg, phembot) {
    /**-----------------------------------------------------------------------*/
    /** Write the phembot file to the file system and execute it:             */
    /**-----------------------------------------------------------------------*/
    executePhembot(phembot, msg);
});

/**---------------------------------------------------------------------------*/
/** Function: executePhembot                                                  */
/** Executes a phembot by writing the file to disk and then invoking the OS   */
/** shell command with the Write effector.                                    */
/**                                                                           */
/** @param {object} phembot     The phembot to write and execute.             */
/** @param {string} msg         The message to show above the dyno.           */
/**---------------------------------------------------------------------------*/
function executePhembot(phembot, msg) {
    /**-----------------------------------------------------------------------*/
    /** Show a random animation:                                              */
    /**-----------------------------------------------------------------------*/
    showAnimation(msg);

    /**-----------------------------------------------------------------------*/
    /** Write the phembot file to disk:                                       */
    /**-----------------------------------------------------------------------*/
    var phembotFileName = appContext.user.profiles[appContext.startProfile].pathRemote + 
                          '/' + appContext.user.pathRemotePhembots + '/bot' + 
                          util.getTimeStamp() + '.json';
    fs.writeFile(phembotFileName, JSON.stringify(phembot), function (err) {
        if (err) {
            console.log(err);
            return err;
        }
        else {
            /**---------------------------------------------------------------*/
            /** Issue the shell command to use the phembot with the Write     */
            /** effector:                                                     */
            /**---------------------------------------------------------------*/
            var s = '"' + appContext.user.profiles[appContext.startProfile].pathWrite + '"' + 
                '\ /q\ /x\ /l"' + appContext.user.profiles[appContext.startProfile].pathRemote + '/' + 
                appContext.user.pathRemoteEffectors + '/' + appContext.user.fileRemoteEffector + 
                '"' + '\ ' + '"' + phembotFileName + '"';
            shell.exec(s, {async:true}, function(code, output) {
                /**-----------------------------------------------------------*/
                /** Read the phembot file. It should have been updated with   */
                /** the phembot execution data if there was any:              */
                /**-----------------------------------------------------------*/
                fs.readFile(phembotFileName, 'utf8', function(err, data) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        /**---------------------------------------------------*/
                        /** Post the phembot to the server for processing:    */
                        /**---------------------------------------------------*/
                        var phembot = JSON.parse(data);
                        postData('phembot', phembot);
                        stopAnimation();
                    }
                });
            });
        }
    });
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
