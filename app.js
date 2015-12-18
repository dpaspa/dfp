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
/** Define a global object variable to store the application context for this */
/** session:                                                                  */
/**---------------------------------------------------------------------------*/
var appContext = {};

/**---------------------------------------------------------------------------*/
/** Declare the local server configuration settings:                          */
/**---------------------------------------------------------------------------*/
var config = require('./config');

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from external node packages:      */
/**---------------------------------------------------------------------------*/
var app = require('app');                      // Control application life
var BrowserWindow = require('browser-window'); // Create native browser window
var commandLineArgs = require('command-line-args');
var request = require('request');
const ipcMain = require('electron').ipcMain;         // Inter-process communication
var menubar = require('menubar');
var electronGoogleOauth = require('electron-google-oauth');
var shell = require('shelljs');
var io = require('socket.io');
var fs = require('fs');
var open = require("open");

/**---------------------------------------------------------------------------*/
/** Define the command line argument interface:                               */
/**---------------------------------------------------------------------------*/
const optionDefinitions = [
    {
        name: 'help', description: 'Display this usage guide.',
        alias: 'h', type: Boolean, defaultValue: false
    },
    {
        name: 'profile', description: 'User environment profile to use.',
        alias: 'p', type: String, defaultValue: 'default'
    },
    {
        name: 'view', description: 'View to show on startup.',
        alias: 'v', type: String, defaultValue: 'do'
    }
];

const optionTitles = {
    title: 'Desktop focalPoint',
    description: 'The client front end focal point for the ipoogi QMS.',
    footer: 'Project home: [underline]{https://ipoogi.com}'
};

/**---------------------------------------------------------------------------*/
/** Get the command line arguments:                                           */
/**---------------------------------------------------------------------------*/
var cli = commandLineArgs(optionDefinitions, optionTitles);
var options = cli.parse();

/**---------------------------------------------------------------------------*/
/** Display the help information and exit if help option specified:           */
/**---------------------------------------------------------------------------*/
if (options.help) {
    console.log(cli.getUsage(optionDefinitions, optionTitles))
    app.quit();
}

/**---------------------------------------------------------------------------*/
/** Get the startup view and user profile to use:                             */
/**---------------------------------------------------------------------------*/
appContext.startProfile = options.profile;
appContext.startView = options.view;

/*----------------------------------------------------------------------------*/
/** Get the server host and port settings:                                    */
/*----------------------------------------------------------------------------*/
config.getConfig(appContext);

/**---------------------------------------------------------------------------*/
/** Keep a global reference to the window object. If not, the window will be  */
/** closed automatically when the JavaScript object is GCed. chatWindow is    */
/** global as their can be only one:                                          */
/**---------------------------------------------------------------------------*/
var chatWindow = null;
var mainWindow = null;

/**---------------------------------------------------------------------------*/
/** Keep a global reference to the screen object for window sizing:           */
/**---------------------------------------------------------------------------*/
var atomScreen = null;

/**---------------------------------------------------------------------------*/
/** Add an entry in the menu bar as an application short cut and task bar     */
/** menu:                                                                     */
/**---------------------------------------------------------------------------*/
var mb = menubar({
    preloadWindow: true,
    width: 200,
    height: 210,
    'window-position': 'topRight',
    index: 'file://' + __dirname + '/mb.html',
    icon: __dirname + '/images/IconTemplate.png'
});

/**---------------------------------------------------------------------------*/
/** This method will be called when the menu bar is ready:                    */
/**---------------------------------------------------------------------------*/
mb.on('after-create-window', function ready () {
    /**-----------------------------------------------------------------------*/
    /** Menu bar click event:                                                 */
    /**-----------------------------------------------------------------------*/
    mb.on('click', function () {
        var trayBounds;
        mb.positioner.move('topRight');
        mb.positioner.calculate('topRight', trayBounds);
        console.log(JSON.stringify(trayBounds));
        mb.showWindow();
    });
});

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
/** Declare module level variables included from other node packages:         */
/**---------------------------------------------------------------------------*/
// var os = require('os');

/*----------------------------------------------------------------------------*/
/** Process according to operating system platform:                           */
/*----------------------------------------------------------------------------*/
// var osName = os.platform();

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

    /**-----------------------------------------------------------------------*/
    /** Set all the windows to the same size and position based on the screen */
    /** display dimensions:                                                   */
    /** TODO: Window animations.                                              */
    /**-----------------------------------------------------------------------*/
    var size = atomScreen.getPrimaryDisplay().workAreaSize;
    var finalX = 70;
    var finalY = 100;
    var finalWidth = size.width-350-finalX;
    var finalHeight = size.height-(2 * finalY);

    /**-----------------------------------------------------------------------*/
    /** Roll up events:                                                       */
    /**-----------------------------------------------------------------------*/
    var rollInterval;
    var currentWidth;

    /**-----------------------------------------------------------------------*/
    /** Create the player window for the application:                         */
    /**-----------------------------------------------------------------------*/
    var playerWindow = new BrowserWindow({
        title: 'focalPoint phembot player',
        width: 227,
        height: size.height,
        "skip-taskbar": true,
        "always-on-top": true,
        frame: false,
        transparent: false,
        show: false
    });

    /**-----------------------------------------------------------------------*/
    /** Set the position to the right of the screen:                          */
    /**-----------------------------------------------------------------------*/
    playerWindow.setPosition(size.width-227, 0);

    /**-----------------------------------------------------------------------*/
    /** Load the player page of the app:                                      */
    /**-----------------------------------------------------------------------*/
    playerWindow.loadURL('http://' + appContext.serverConfig.host + ':' + 
                         appContext.serverConfig.port + '/phembot/player');

    /**-----------------------------------------------------------------------*/
    /** Create the user login window for the application:                     */
    /**-----------------------------------------------------------------------*/
    var userWidth = 800;
    var userHeight = 420;
    var userX = (size.width - userWidth) / 2;
    var userY = (size.height - userHeight) / 2;
    var userWindow = new BrowserWindow({
        title: 'focalPoint user login',
        width: userWidth,
        height: userHeight,
        "skip-taskbar": true,
        "always-on-top": true,
        frame: false,
        transparent: false
    });

    /**-----------------------------------------------------------------------*/
    /** Set the position to the right of the screen:                          */
    /**-----------------------------------------------------------------------*/
    userWindow.setPosition(userX, userY);

    /**-----------------------------------------------------------------------*/
    /** Load the user html page of the app:                                   */
    /**-----------------------------------------------------------------------*/
    userWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/user/login');
//    userWindow.webContents.send('dashboardClose');

    /**-----------------------------------------------------------------------*/
    /** Create the main browser window for the application:                   */
    /**-----------------------------------------------------------------------*/
    mainWindow = new BrowserWindow({
        title: 'focalPoint',
        width: 350,
        height: size.height,
        transparent: false,
        "skip-taskbar": true,
        "always-on-top": true,
        frame: false,
        show: false
    });

    /**-----------------------------------------------------------------------*/
    /** Set the position to the right of the screen:                          */
    /** TODO: Option to set left of screen.                                   */
    /**-----------------------------------------------------------------------*/
    mainWindow.setPosition(size.width-350, 0);
//    mainWindow.setVisibleOnAllWorkspaces(true);

    /**-----------------------------------------------------------------------*/
    /** Ensure the main window is always shown top most:                      */
    /**-----------------------------------------------------------------------*/
    var mainOnTop = setInterval(function() {
        if (mainWindow === null) {
        }
        else if (mainWindow.isVisible()) {
            mainWindow.setAlwaysOnTop(true);
        }

        /**-------------------------------------------------------------------*/
        /** Unless the player window is on top:                               */
        /**-------------------------------------------------------------------*/
        if (playerWindow === null) {
        }
        else if (playerWindow.isVisible()) {
            playerWindow.setAlwaysOnTop(true);
        }
    }, 10);

    /**-----------------------------------------------------------------------*/
    /** Set up the window close event emitter callback:                       */
    /**-----------------------------------------------------------------------*/
    mainWindow.on('closed', function() {
        /**-------------------------------------------------------------------*/
        /** Clear the main window on top function and roll up interval timers:*/
        /**-------------------------------------------------------------------*/
        clearInterval(mainOnTop);
        clearInterval(rollInterval);

        /**-------------------------------------------------------------------*/
        /** Dereference the window object:                                    */
        /** TODO: Store multi-windows in an array. This is the time to delete */
        /** the corresponding element.                                        */
        /**-------------------------------------------------------------------*/
        mainWindow = null;
    });

    /**-----------------------------------------------------------------------*/
    /** Set up the player window close event emitter callback:                */
    /**-----------------------------------------------------------------------*/
    playerWindow.on('closed', function() {
        playerWindow = null;
    });

    /**-----------------------------------------------------------------------*/
    /** Set up the user window close event emitter callback:                  */
    /**-----------------------------------------------------------------------*/
    userWindow.on('closed', function() {
        userWindow = null;
    });

    /**-----------------------------------------------------------------------*/
    /** Set up the window lost focus event emitter callback:                  */
    /**-----------------------------------------------------------------------*/
/*
    mainWindow.on('blur', function() {
        var sizeMain = mainWindow.getSize();
        currentWidth = sizeMain[0];
        if (currentWidth > 10 ) {
            rollInterval = setInterval(function () {windowTransition(-5)}, 3);
        }
    });
*/

    /**-----------------------------------------------------------------------*/
    /** Set up the window gains focus event emitter callback:                 */
    /**-----------------------------------------------------------------------*/
/*
    mainWindow.on('focus', function() {
        var sizeMain = mainWindow.getSize();
        currentWidth = sizeMain[0];
        if (currentWidth < 350 ) {
            rollInterval = setInterval(function () {windowTransition(5)}, 3);
        }
    });
*/

    /**-----------------------------------------------------------------------*/
    /** Set up the window gains focus event emitter callback:                 */
    /**-----------------------------------------------------------------------*/
/*
    function windowTransition(inc) {
        currentWidth = currentWidth + inc;
        mainWindow.setBounds({
            x: size.width-currentWidth,
            y: 0,
            width: currentWidth,
            height: size.height
        });
        if (currentWidth <= 10 || currentWidth >= 350) {
            clearInterval(rollInterval);
            if (currentWidth <= 10) {
                mainWindow.webContents.send('rolled');
            }
            else {
                mainWindow.webContents.send('unrolled');
            }
        }
    }
*/

    /**************************************************************************/
    /**                                                                       */
    /** IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC   IPC */
    /**                                                                       */
    /** Inter-process communication events.                                   */
    /**************************************************************************/

    /**-----------------------------------------------------------------------*/
    /** Open the document store website URI:                                  */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('docstore', function() {
        open(appContext.user.docstore);
    });

    /**-----------------------------------------------------------------------*/
    /** Set up the window lost focus event emitter callback:                  */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('doRoll', function() {
        var sizeMain = mainWindow.getSize();
        currentWidth = sizeMain[0];
        rollInterval = setInterval(function () {windowTransition(-5)}, 3);
    });

    /**-----------------------------------------------------------------------*/
    /** Set up the window gains focus event emitter callback:                 */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('doUnroll', function() {
        var sizeMain = mainWindow.getSize();
        currentWidth = sizeMain[0];
        rollInterval = setInterval(function () {windowTransition(5)}, 3);
    });

    /**-----------------------------------------------------------------------*/
    /** Set up the window gains focus event emitter callback:                 */
    /**-----------------------------------------------------------------------*/
    function windowTransition(inc) {
        currentWidth = currentWidth + inc;
        mainWindow.setBounds({
            x: size.width-currentWidth,
            y: 0,
            width: currentWidth,
            height: size.height
        });
        if (currentWidth == 5 || currentWidth == 350) {
            clearInterval(rollInterval);
            if (currentWidth == 5) {
                mainWindow.webContents.send('rolled');
            }
            else {
                mainWindow.webContents.send('unrolled');
            }
        }
    }

    /**-----------------------------------------------------------------------*/
    /** Process the calendar label click event:                               */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('calendar', function() {
        /**-----------------------------------------------------------------------*/
        /** Instantiate the windows but make don't make them visible.             */
        /** Create the calendar window:                                           */
        /**-----------------------------------------------------------------------*/
        var calendarWindow = new BrowserWindow({
            title: 'focalPoint calendar',
            width: finalWidth,
            height: finalHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        /**-------------------------------------------------------------------*/
        /** Display the data table window:                                    */
        /**-------------------------------------------------------------------*/
        calendarWindow.setPosition(finalX, finalY);
//        calendarWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/calendar');
//        calendarWindow.loadURL('https://calendar.google.com/calendar/render?eid=MjAxNTExMTFfNjBvMzBjaGo2c28zMGMxZzYwbzMwZHI0Y28gZW4uYXVzdHJhbGlhbiNob2xpZGF5QHY&ctz=Asia/Calcutta&sf=true&output=xml');
        calendarWindow.loadURL('https://calendar.google.com/calendar/render??eid=MjAxNTExMTFfNjBvMzBjaGo2c28zMGMxZzYwbzMwZHI0Y28gZW4uYXVzdHJhbGlhbiNob2xpZGF5QHY&ctz=Asia/Calcutta&sf=true&output=xml');
        calendarWindow.show();
    });

    /**-----------------------------------------------------------------------*/
    /** Process the calendar window close button click event:                 */
    /**-----------------------------------------------------------------------*/
/*
    ipcMain.on('chatClose', function(arg) {
        chatWindow.hide();
//        mainWindow.webContents.send('chatClose');
    });
*/

    /**-----------------------------------------------------------------------*/
    /** Chat page request:                                                    */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('chat', function(event, arg) {
        /**-------------------------------------------------------------------*/
        /** Check if the chat windows has not been created yet:               */
        /**-------------------------------------------------------------------*/
        if (!chatWindow) {
            /**---------------------------------------------------------------*/
            /** Create a new chat window:                                     */
            /**---------------------------------------------------------------*/
            var chatWidth = 400;
            var chatHeight = 500;
            var chatX = size.width - chatWidth - 350
            var chatY = (size.height - chatHeight) / 2;
            chatWindow = new BrowserWindow({
                title: 'User Preferences',
                width: chatWidth,
                height: chatHeight,
                "skip-taskbar": true,
                frame: false,
                transparent: false,
                show: false
            });

            /**---------------------------------------------------------------*/
            /** Load the chat window:                                         */
            /**---------------------------------------------------------------*/
            chatWindow.setPosition(chatX, chatY);
            chatWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/chat');
            chatWindow.show();
        }
        else if (chatWindow.isVisible()) {
            chatWindow.hide();
        }
        else {
            chatWindow.show();
        }
    });

    /**-----------------------------------------------------------------------*/
    /** Process the dashboard label click event:                              */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('dashboard', function() {
        /**-------------------------------------------------------------------*/
        /** Create the dashboard window:                                      */
        /**-------------------------------------------------------------------*/
        var dashWidth = 500;
        var dashHeight = size.height;
        var dashX = size.width - dashWidth - 350
        var dashY = (size.height - dashHeight) / 2;
        var dashboardWindow = new BrowserWindow({
            title: 'focalPoint dashboard',
            width: dashWidth,
            height: dashHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        /**-------------------------------------------------------------------*/
        /** Display the data table window:                                    */
        /**-------------------------------------------------------------------*/
        dashboardWindow.setPosition(dashX, dashY);
        dashboardWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/dashboard');
        dashboardWindow.show();
    });

    /**-----------------------------------------------------------------------*/
    /** Process the dashboard window close button click event:                */
    /**-----------------------------------------------------------------------*/
/*
    ipcMain.on('dashboardClose', function(arg) {
        dashboardWindow.hide();
        mainWindow.webContents.send('dashboardClose');
    });
*/

    /**-----------------------------------------------------------------------*/
    /** Dock the main window:                                                 */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('dock', function() {
        console.log('dock');
    });

    /**-----------------------------------------------------------------------*/
    /** Process the master data list item click event:                        */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('datatable', function(event, name) {
        /**-------------------------------------------------------------------*/
        /** Create the master data list table window:                         */
        /**-------------------------------------------------------------------*/
        var tableWindow = new BrowserWindow({
            title: 'focalPoint Master Data List',
            width: finalWidth,
            height: finalHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        /**-------------------------------------------------------------------*/
        /** Display the data table window:                                    */
        /**-------------------------------------------------------------------*/
        tableWindow.setPosition(finalX, finalY);
        tableWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/table/' + name);
        tableWindow.show();
    });

    /**-----------------------------------------------------------------------*/
    /** Process the master data table window close button click event:        */
    /**-----------------------------------------------------------------------*/
//    ipcMain.on('datatableClose', function(arg) {
//        tableWindow.hide();
//    });

    /**-----------------------------------------------------------------------*/
    /** Phembot execution request from another rendered window:               */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('executePhembot', function(event, msg, phembot) {
        mainWindow.webContents.send('executePhembot', msg, phembot);
    });

    /**-----------------------------------------------------------------------*/
    /** Open the online getting started guide:                                */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('getting-started', function() {
        open(appContext.user.docstore);
    });

    /**-----------------------------------------------------------------------*/
    /** Hide or show the main window:                                         */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('hideMain', function() {
        if (mainWindow === null) {
        }
        else if (mainWindow.isVisible()) {
            mainWindow.hide();
        }
    });

    ipcMain.on('showMain', function() {
        if (mainWindow === null) {
        }
        else if (!mainWindow.isVisible()) {
            mainWindow.show();
        }

        if (playerWindow === null) {
        }
        else if (playerWindow.isVisible()) {
            playerWindow.hide();
        }
    });

    /**-----------------------------------------------------------------------*/
    /** Hide or show the player window:                                       */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('hidePlayer', function() {
        if (playerWindow === null) {
        }
        else if (playerWindow.isVisible()) {
            playerWindow.hide();
        }

        if (mainWindow === null) {
        }
        else if (!mainWindow.isVisible()) {
            mainWindow.show();
        }
    });

    ipcMain.on('showPlayer', function() {
        if (playerWindow === null) {
        }
        else if (!playerWindow.isVisible()) {
            playerWindow.show();
        }

        if (mainWindow === null) {
        }
        else if (mainWindow.isVisible()) {
            mainWindow.hide();
        }
    });

    /**-----------------------------------------------------------------------*/
    /** Process the search input box enter key event:                         */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('learning', function(event, searchText) {
        /**-------------------------------------------------------------------*/
        /** Create the learning window:                                       */
        /**-------------------------------------------------------------------*/
        var learningWindow = new BrowserWindow({
            title: 'focalPoint Learning Chunks',
            width: finalWidth,
            height: finalHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        console.log(searchText);
        learningWindow.setPosition(finalX, finalY);
        learningWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/learning/' + searchText);
        learningWindow.show();
    });

    /**-----------------------------------------------------------------------*/
    /** Process the learning window close button click event:                 */
    /**-----------------------------------------------------------------------*/
/*
    ipcMain.on('learningClose', function(arg) {
        learningWindow.hide();
    });
*/

    /**-----------------------------------------------------------------------*/
    /** Display the full form after user logged in successfully:              */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('login', function(event, user) {
        /**-------------------------------------------------------------------*/
        /** Load the main html page of the app:                               */
        /**-------------------------------------------------------------------*/
        mainWindow.loadURL('file://' + __dirname + '/main.html');

        /**-------------------------------------------------------------------*/
        /** Hide the login window and show the main window:                   */
        /**-------------------------------------------------------------------*/
        userWindow.hide();
        appContext.user = user;
        var context = JSON.stringify(appContext);
        mainWindow.webContents.on('did-finish-load', function() {
            mainWindow.webContents.send('appContext', context);
            mainWindow.show();
            userWindow.webContents.send('flush');
        });
    });

    /**-----------------------------------------------------------------------*/
    /** Display the chat box to the administrator if the user could not login:*/
    /**-----------------------------------------------------------------------*/
    ipcMain.on('loginUnsuccessful', function() {
    });

    /**-----------------------------------------------------------------------*/
    /** Process the application logout event by closing all windows and       */
    /** logging out the user and showing the login window again:              */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('logout', function() {
        mainWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/user/logout');
        mainWindow.hide();
        userWindow.show();
    });

    /**-----------------------------------------------------------------------*/
    /** Process an OS shell command execution event:                          */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('osShell', function(event, arg) {
        var effector = shell.exec(arg, {async:true}).output;
    });

    /**-----------------------------------------------------------------------*/
    /** Process the phembot list item click event:                            */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('phembot', function(event, phembot) {
        /**-------------------------------------------------------------------*/
        /** Show the phembot player window and hide the main window:          */
        /**-------------------------------------------------------------------*/
        if (playerWindow === null) {
            /**---------------------------------------------------------------*/
            /** Create the player window for the application:                 */
            /**---------------------------------------------------------------*/
            playerWindow = new BrowserWindow({
                title: 'focalPoint phembot player',
                width: 227,
                height: size.height,
                "skip-taskbar": true,
                "always-on-top": true,
                frame: false,
                transparent: false,
                show: false
            });

            /**---------------------------------------------------------------*/
            /** Set the position to the right of the screen:                  */
            /**---------------------------------------------------------------*/
            playerWindow.setPosition(size.width-227, 0);

            /**---------------------------------------------------------------*/
            /** Load the player page of the app:                              */
            /**---------------------------------------------------------------*/
            playerWindow.loadURL('http://' + appContext.serverConfig.host + ':' + 
                                 appContext.serverConfig.port + '/phembot/player');
        }
        
        /**------------------------------------------------------------------*/
        /** Show the player window and send the application data and         */
        /** selected phembot:                                                */
        /**------------------------------------------------------------------*/
        playerWindow.show();
        playerWindow.webContents.send('appContext', appContext);
        playerWindow.webContents.send('phembot', phembot);

        /**-------------------------------------------------------------------*/
        /** Hide the main window:                                             */
        /**-------------------------------------------------------------------*/
        if (mainWindow === null) {
        }
        else {
            mainWindow.hide();
        }

        /**-------------------------------------------------------------------*/
        /** Create the phembot detail window:                                 */
        /**-------------------------------------------------------------------*/
/*
        var phembotWidth = 500;
        var phembotHeight = 630;
        var phembotX = size.width - phembotWidth - 350
        var phembotY = (size.height - phembotHeight) / 2;
        var phembotWindow = new BrowserWindow({
            title: 'focalPoint phembot details',
            width: phembotWidth,
            height: phembotHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        /**-------------------------------------------------------------------*/
        /** Display the phembot data window:                                  */
        /**-------------------------------------------------------------------*/
/*
        phembotWindow.setPosition(phembotX, phembotY);
        phembotWindow.loadURL('http://' + appContext.serverConfig.host + ':' + 
            appContext.serverConfig.port + '/phembot/' + type + '/id/' + id);
        phembotWindow.show();
        phembotWindow.webContents.on('did-finish-load', function() {
            phembotWindow.webContents.send('appContext', appContext);
        });
*/
    });

    /**-----------------------------------------------------------------------*/
    /** Process the phembot list item click event:                            */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('phembots', function(event, phembots) {
        /**-------------------------------------------------------------------*/
        /** Show the phembot player window and hide the main window:          */
        /**-------------------------------------------------------------------*/
        if (playerWindow === null) {
        }
        else {
            /**---------------------------------------------------------------*/
            /** Show the player window and send the application data and      */
            /** selected phembot:                                             */
            /**---------------------------------------------------------------*/
            playerWindow.show();
            playerWindow.webContents.send('appContext', appContext);
            playerWindow.webContents.send('phembots', phembots);
        }
        if (mainWindow === null) {
        }
        else {
            mainWindow.hide();
        }
    });

    /**-----------------------------------------------------------------------*/
    /** Process the application quit event by closing all windows and         */
    /** quitting the application:                                             */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('quit', function() {
//        calendarWindow.close();
//        dashboardWindow.close();
//        learningWindow.close();
        userWindow.close();
//        tableWindow.close();
        app.quit();
    });

    /**-----------------------------------------------------------------------*/
    /** Player controls:                                                      */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('player-pause', function() {
        console.log('pause');
    });
    ipcMain.on('player-play', function() {
        console.log('play');
    });
    ipcMain.on('player-stop', function() {
        console.log('stop');
    });

    /**-----------------------------------------------------------------------*/
    /** Refresh the main window display:                                      */
    /**-----------------------------------------------------------------------*/
//    ipcMain.on('refresh', function() {
//        mainWindow.reload();
//        mainWindow.webContents.send('appContext', appContext);
//    });

    /**-----------------------------------------------------------------------*/
    /** Server response to be rendered:                                       */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('renderResponse', function(event, response) {
        var responseWidth = 700;
        var responseHeight = 630;
        var responseX = size.width - responseWidth - 350
        var responseY = (size.height - responseHeight) / 2;
        var responseWindow = new BrowserWindow({
            width: responseWidth,
            height: responseHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        responseWindow.setPosition(responseX, responseY);
        responseWindow.loadURL('http://' + appContext.serverConfig.host + ':' + 
            appContext.serverConfig.port + '/player');
        responseWindow.show();
        responseWindow.webContents.on('did-finish-load', function() {
            responseWindow.webContents.send('responseData', response.body, appContext);
        });
    });

    /**-----------------------------------------------------------------------*/
    /** Main window dyno animations:                                          */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('showAnimation', function(event, msg) {
        mainWindow.webContents.send('showAnimation', msg);
    });
    ipcMain.on('stopAnimation', function(event, msg) {
        mainWindow.webContents.send('stopAnimation', msg);
    });

    /**-----------------------------------------------------------------------*/
    /** Open the online user manual:                                          */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('user-manual', function() {
        open(appContext.user.docstore);
    });

    /**-----------------------------------------------------------------------*/
    /** User preferences page request:                                        */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('userPreferences', function(event, arg) {
        /**-------------------------------------------------------------------*/
        /** Create a new utility window:                                      */
        /**-------------------------------------------------------------------*/
        var utilWindow = new BrowserWindow({
            title: 'User Preferences',
            width: finalWidth,
            height: finalHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        /**-------------------------------------------------------------------*/
        /** Display the preferences window:                                   */
        /**-------------------------------------------------------------------*/
        utilWindow.setPosition(finalX, finalY);
        utilWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/user/preferences');
        utilWindow.show();
    });

    /**-----------------------------------------------------------------------*/
    /** User profile page request:                                            */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('userProfile', function(event, arg) {
        /**-------------------------------------------------------------------*/
        /** Create a new utility window:                                      */
        /**-------------------------------------------------------------------*/
        var utilWindow = new BrowserWindow({
            title: 'User Preferences',
            width: finalWidth,
            height: finalHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        /**-------------------------------------------------------------------*/
        /** Display the user profile form:                                    */
        /**-------------------------------------------------------------------*/
        utilWindow.setPosition(finalX, finalY);
        utilWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/user/profile');
        utilWindow.show();
    });

    /**-----------------------------------------------------------------------*/
    /** User registration page request:                                       */
    /**-----------------------------------------------------------------------*/
    ipcMain.on('userRegister', function(event, arg) {
        /**-------------------------------------------------------------------*/
        /** Create a new utility window:                                      */
        /**-------------------------------------------------------------------*/
        var utilWindow = new BrowserWindow({
            title: 'User Preferences',
            width: finalWidth,
            height: finalHeight,
            "skip-taskbar": true,
            frame: false,
            transparent: false,
            show: false
        });

        /**-------------------------------------------------------------------*/
        /** Display the user registration window:                             */
        /**-------------------------------------------------------------------*/
        utilWindow.setPosition(finalX, finalY);
        utilWindow.loadURL('http://' + appContext.serverConfig.host + ':' + appContext.serverConfig.port + '/user/register');
        utilWindow.show();
    });

    /**-----------------------------------------------------------------------*/
    /** Main window was refreshed. Display the correct context:               */
    /**-----------------------------------------------------------------------*/
//    mainWindow.webContents.on('did-finish-load', function() {
//        mainWindow.webContents.send('render-finished');
//    });
});
