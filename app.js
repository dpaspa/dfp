/**---------------------------------------------------------------------------*/
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the main application script for the Electron application for the  */
/** dfp (desktop focal point) application. The dfp is the desktop client      */
/** application for integrating the user's workflows into the QMS back end.   */
/*----------------------------------------------------------------------------*/
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       30-Aug-2015 NA   Initial design.                    */
/**---------------------------------------------------------------------------*/
'use strict';

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from local application files:     */
/**---------------------------------------------------------------------------*/
var config = require('./config');

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from external node packages:      */
/**---------------------------------------------------------------------------*/
var app = require('app');                      // Control application life
var BrowserWindow = require('browser-window'); // Create native browser window
var ipc = require('ipc');                      // Inter-process communication
var menubar = require('menubar');
var electronGoogleOauth = require('electron-google-oauth');
var path = require('path');
var shell = require('shelljs');
var io = require('socket.io');
var fs = require('fs');

/**---------------------------------------------------------------------------*/
/** Keep a global reference to the window object. If not, the window will be  */
/** closed automatically when the JavaScript object is GCed:                  */
/**---------------------------------------------------------------------------*/
var mainWindow = null;

/**---------------------------------------------------------------------------*/
/** Keep a global reference to the screen object and the other windows:       */
/**---------------------------------------------------------------------------*/
var atomScreen = null;

/**---------------------------------------------------------------------------*/
/** Quit method when all windows are closed:                                  */
/**---------------------------------------------------------------------------*/
app.on('window-all-closed', function() {
    /**-----------------------------------------------------------------------*/
    /** On OS X it is common for applications and their menu bar to stay      */
    /** active until the user quits explicitly with Cmd + Q:                  */
    /**-----------------------------------------------------------------------*/
    if (process.platform != 'darwin') {
        app.quit();
    }
});

/**---------------------------------------------------------------------------*/
/** This method will be called when Electron has finished initialization and  */
/** is ready to create browser windows:                                       */
/**---------------------------------------------------------------------------*/
app.on('ready', function() {
    /**-----------------------------------------------------------------------*/
    /** Get the screen size. Can only initialize the "screen" module after    */
    /** the app is ready:                                                     */
    /**-----------------------------------------------------------------------*/
    atomScreen = require('screen');
    var size = atomScreen.getPrimaryDisplay().workAreaSize;

    /**-----------------------------------------------------------------------*/
    /** Create the main browser window for the application:                   */
    /**-----------------------------------------------------------------------*/
    mainWindow = new BrowserWindow({
        title: 'Desktop Focal Point', 
        width: 350, 
        height: size.height, 
        "skip-taskbar": true,
        "always-on-top": true,
        frame: false
    });

    /**-----------------------------------------------------------------------*/
    /** Set the position to the right of the screen:                          */
    /** TODO: slide smoothly in and out on mouse over or hot key.             */
    /** TODO: Option to set left of screen.                                   */
    /**-----------------------------------------------------------------------*/
    mainWindow.setPosition(size.width-350, 0)

    /**-----------------------------------------------------------------------*/
    /** Load the main html page of the app:                                   */
    /**-----------------------------------------------------------------------*/
    mainWindow.loadUrl('file://' + __dirname + '/main.html');

    /**-----------------------------------------------------------------------*/
    /** Ensure the main window is always shown top most:                      */
    /**-----------------------------------------------------------------------*/
    var mainOnTop = setInterval(function(){
//        mainWindow.setAlwaysOnTop(true);
    }, 1);

    /**-----------------------------------------------------------------------*/
    /** Set up the window close event emitter callback:                       */
    /**-----------------------------------------------------------------------*/
    mainWindow.on('closed', function() {
        /**-------------------------------------------------------------------*/
        /** Clear the main window on top function:                            */
        /**-------------------------------------------------------------------*/
        clearInterval(mainOnTop);

        /**-------------------------------------------------------------------*/
        /** Dereference the window object:                                    */
        /** TODO: Store multi-windows in an array. This is the time to delete */
        /** the corresponding element.                                        */
        /**-------------------------------------------------------------------*/
        mainWindow = null;
    });

    /**************************************************************************/
    /**                                                                       */
    /** WINDOWS   WINDOWS   WINDOWS   WINDOWS   WINDOWS   WINDOWS   WINDOWS   */
    /**                                                                       */
    /** Set up the other application windows.                                 */
    /**************************************************************************/

    /**-----------------------------------------------------------------------*/
    /** Set all the windows to the same size and position based on the screen */
    /** display dimensions:                                                   */
    /** TODO: Window animations.                                              */
    /**-----------------------------------------------------------------------*/
    var size = atomScreen.getPrimaryDisplay().workAreaSize;
    var finalWidth = size.width-350-70;
    var finalHeight = size.height-200;
    var finalX = 70;
    var finalY = 100;

    /**-----------------------------------------------------------------------*/
    /** Instantiate the windows but make don't make them visible:             */
    /**-----------------------------------------------------------------------*/
    var calendarWindow = new BrowserWindow({
        title: 'Desktop Focal Point Calendar', 
        width: finalWidth,
        height: finalHeight,
        "skip-taskbar": true,
        frame: false,
        transparent: true,
        show: false
    });

    var dashboardWindow = new BrowserWindow({
        title: 'Desktop Focal Point Dashboard', 
        width: finalWidth,
        height: finalHeight,
        "skip-taskbar": true,
        frame: false,
        transparent: true,
        show: false
    });

    var learningWindow = new BrowserWindow({
        title: 'Desktop Focal Point Learning Chunks', 
        width: finalWidth,
        height: finalHeight,
        "skip-taskbar": true,
        frame: false,
        transparent: true,
        show: false
    });

    var tableWindow = new BrowserWindow({
        title: 'Desktop Focal Point Master Data List', 
        width: finalWidth,
        height: finalHeight,
        "skip-taskbar": true,
        frame: false,
        transparent: true,
        show: false
    });

    /**-----------------------------------------------------------------------*/
    /** Set all the positions to be the same:                                 */
    /**-----------------------------------------------------------------------*/
    calendarWindow.setPosition(finalX, finalY);
    dashboardWindow.setPosition(finalX, finalY);
    learningWindow.setPosition(finalX, finalY);
    tableWindow.setPosition(finalX, finalY);

    /**-----------------------------------------------------------------------*/
    /** Load the URIs of the windows:                                         */
    /**-----------------------------------------------------------------------*/
    calendarWindow.loadUrl('file://' + __dirname + '/calendar.html');
    dashboardWindow.loadUrl('http://127.0.0.1:3030/sample');
    tableWindow.loadUrl('file://' + __dirname + '/table.html');
    learningWindow.loadUrl('file://' + __dirname + '/learning.html');
//    dashboardWindow.loadUrl('file://' + __dirname + '/dashboard.html');
//    tableWindow.loadUrl('file://' + __dirname + '/table.html?type=' + type + field + id);
//    learningWindow.loadUrl('file://' + __dirname + '/learn.html?chunk=' + chunk);


    /**************************************************************************/
    /**                                                                       */
    /** GOOGLE AUTHORIZATION   GOOGLE AUTHORIZATION   GOOGLE AUTHORIZATION    */
    /**                                                                       */
    /** Use the Google API to access the calendar.                            */
    /**************************************************************************/

    /**-----------------------------------------------------------------------*/
    /** Perform Google authorization to use the Calendar API:                 */
    /**-----------------------------------------------------------------------*/
    var googleOauth = electronGoogleOauth(calendarWindow);

    /**-----------------------------------------------------------------------*/
    /** Retrieve authorization code only:                                     */
    /** TODO: Replace with config setting.                                    */
    /**-----------------------------------------------------------------------*/
    var authCode = googleOauth.getAuthorizationCode(
        ['https://www.google.com/m8/feeds'],
        '818711560460-ocobmj32fqklf9nd04mqjqerloc2qhnk.apps.googleusercontent.com',
        '1Runtywm59xTHd5z8EWznmzd'
    );

    /**-----------------------------------------------------------------------*/
    /** Retrieve access token and refresh token:                              */
    /** TODO: Replace with config setting.                                    */
    /**-----------------------------------------------------------------------*/
    var result = googleOauth.getAccessToken(
        ['https://www.google.com/m8/feeds'],
        '818711560460-ocobmj32fqklf9nd04mqjqerloc2qhnk.apps.googleusercontent.com',
        '1Runtywm59xTHd5z8EWznmzd'
    );

    /**************************************************************************/
    /**                                                                       */
    /** IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC */
    /**                                                                       */
    /** Inter-process communication events.                                   */
    /**************************************************************************/

    /**-----------------------------------------------------------------------*/
    /** Process the application quit event by closing all windows and         */
    /** quitting the application:                                             */
    /**-----------------------------------------------------------------------*/
    ipc.on('quit', function() {
        calendarWindow.close();
        dashboardWindow.close();
        learningWindow.close();
        tableWindow.close();
        app.quit();
    });

    /**-----------------------------------------------------------------------*/
    /** Process the calendar label click event:                               */
    /**-----------------------------------------------------------------------*/
    ipc.on('calendar', function() {
        if (calendarWindow.isVisible()) {
            calendarWindow.hide();
            mainWindow.webContents.send('calendarClose');
        }
        else {
            calendarWindow.show();
        } 
    });
    
    /**-----------------------------------------------------------------------*/
    /** Process the calendar window close button click event:                 */
    /**-----------------------------------------------------------------------*/
    ipc.on('calendarClose', function(arg) {
        calendarWindow.hide();
        mainWindow.webContents.send('calendarClose');
    });
    
    /**-----------------------------------------------------------------------*/
    /** Process the dashboard label click event:                              */
    /**-----------------------------------------------------------------------*/
    ipc.on('dashboard', function() {
        if (dashboardWindow.isVisible()) {
            dashboardWindow.hide();
            mainWindow.webContents.send('dashboardClose');
        }
        else {
            dashboardWindow.show();
        } 
    });
    
    /**-----------------------------------------------------------------------*/
    /** Process the dashboard window close button click event:                */
    /**-----------------------------------------------------------------------*/
    ipc.on('dashboardClose', function(arg) {
        dashboardWindow.hide();
        mainWindow.webContents.send('dashboardClose');
    });
    
    /**-----------------------------------------------------------------------*/
    /** Process the search input box enter key event:                         */
    /**-----------------------------------------------------------------------*/
    ipc.on('learning', function(arg) {
        learningWindow.loadUrl('file://' + __dirname + '/learning.html?search=' + arg);
        learningWindow.show();
    });
    
    /**-----------------------------------------------------------------------*/
    /** Process the master data list item click event:                        */
    /**-----------------------------------------------------------------------*/
    ipc.on('datatable', function(event, data) {
        var s = JSON.stringify(data);
        fs.writeFile("./arrays.txt", s , function(err) {
            if(err) {
                return console.log(err);
            }
            else {
                tableWindow.webContents.reload();
                tableWindow.show();
            }
        }); 
    });
    
    /**-----------------------------------------------------------------------*/
    /** Process the master data table window close button click event:        */
    /**-----------------------------------------------------------------------*/
    ipc.on('datatableClose', function(arg) {
        tableWindow.hide();
    });
    
    /**-----------------------------------------------------------------------*/
    /** Process the learning window close button click event:                 */
    /**-----------------------------------------------------------------------*/
    ipc.on('learningClose', function(arg) {
        learningWindow.hide();
    });
    
    /**-----------------------------------------------------------------------*/
    /** Process an OS shell command execution event:                          */
    /**-----------------------------------------------------------------------*/
    ipc.on('osShell', function(event, arg) {
        var effector = shell.exec(arg, {async:true}).output;
    });
}); 

/******************************************************************************/
/**                                                                           */
/** MENUBAR   MENUBAR   MENUBAR   MENUBAR   MENUBAR   MENUBAR   MENUBAR   MEN */
/**                                                                           */
/** Native OS menu bar shortcut icon.                                         */
/******************************************************************************/

/**---------------------------------------------------------------------------*/
/** Add an entry in the menu bar as an application short cut:                 */
/**---------------------------------------------------------------------------*/
var mb = menubar({
    width: 73,
    height: 73,
    index: 'file://' + __dirname + '/main.html',
    icon: path.join(__dirname, 'IconTemplate.png')
});

console.log(__dirname + '/menuIcon.png');
mb.on('ready', function ready () {
    mb.on('click', function () {
        console.log('menubar clicked!');
    });
});

