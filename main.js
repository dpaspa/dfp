'use strict';

var menubar = require('menubar');
var app = require('app'); // Module to control application life
// var async = require('async');
var BrowserWindow = require('browser-window'); // Module to create native browser window
var ipc = require('ipc');
var path = require('path');
var shell = require('shelljs');
var electronGoogleOauth = require('electron-google-oauth');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

// Keep a global reference of the screen object and the other windows
var atomScreen = null;
var dashWindow = null;
var calWindow = null;
var detailWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {

    atomScreen = require('screen');
    var size = atomScreen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: 'Desktop Focal Point', 
        width: 350, 
        height: size.height, 
        "skip-taskbar": true,
        "always-on-top": true,
        frame: false
/*              "node-integration": "iframe",
        "web-preferences": {
            "web-security": false
        } */
    });

    mainWindow.setPosition(size.width-350, 0)

    // and load the index.html of the app.
    mainWindow.loadUrl('file://' + __dirname + '/index.html');
    // Open the devtools.
    // mainWindow.openDevTools();

    var googleOauth = electronGoogleOauth(mainWindow);

    // retrieve authorization code only 
    var authCode = googleOauth.getAuthorizationCode(
        ['https://www.google.com/m8/feeds'],
        '818711560460-ocobmj32fqklf9nd04mqjqerloc2qhnk.apps.googleusercontent.com',
        '1Runtywm59xTHd5z8EWznmzd'
    );

    // retrieve access token and refresh token 
    var result = googleOauth.getAccessToken(
        ['https://www.google.com/m8/feeds'],
        '818711560460-ocobmj32fqklf9nd04mqjqerloc2qhnk.apps.googleusercontent.com',
        '1Runtywm59xTHd5z8EWznmzd'
    );

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});





var mb = menubar({
    width: 350,
    height: 480,
    index: 'file://' + path.join(__dirname, 'index.html'),
    icon: path.join(__dirname, 'IconTemplate.png')
});

mb.on('ready', function ready () {

    ipc.on('event', function(event, arg) {
        var i, aX, aY, aHeight, aWidth;
        var num, sX, sY, fWidth, fHeight, fX, fY;

        if (arg === 'quit') {
        app.quit();
        }

        if (arg === 'dyno') {
	        var version = shell.exec('"C:\\Program\ Files\\Microsoft\ Office\\Office14\\winword"\ /q\ /x\ /lx:\\Business\\ipoogi\\pb.dotm\ x:\\Business\\ipoogi\\anybot.json', {async:true}).output;
        }

        if (arg === 'user') {
//	        shell.echo('user');

//            var size = atomScreen.getPrimaryDisplay().workAreaSize;
            calWindow = new BrowserWindow({
                transparent: true,
                frame: false
            });
//            calWindow.setBounds({width: 200, height: 200, x: size.width / 2 - 100, y: size.height / 2 - 100});
        }

        if (arg === 'dash') {
            if (dashWindow == null) {
//              mainWindow.setBounds({width: size.width, height: size.height, x: 0, y:0});
//              shell.openExternal(el.href);

                var size = atomScreen.getPrimaryDisplay().workAreaSize;

            //  Create the dashboard window.
                dashWindow = new BrowserWindow({
                    title: 'Desktop Focal Point Dashboard', 
                    width: 0, 
                    height: 0, 
                    "skip-taskbar": true,
                    frame: false,
                    kiosk: true,
                    transparent: true
//                    frame: false
    /*              "node-integration": "iframe",
                    "web-preferences": {
                        "web-security": false
                    } */
                });

                dashWindow.loadUrl('http://dashingdemo.herokuapp.com/sample');

                num = 150;
                sX = size.width-350;
                sY = size.height;
                fWidth = size.width-350-100;
                fHeight = size.height-200;
                fX = 100;
                fY = 100;

                animateWindow(dashWindow, num, sX, sY, fWidth, fHeight, fX, fY);

            } else {
                dashWindow.show = false;
            }
        }
    });
}); 

function animateWindow(w, num, sX, sY, fWidth, fHeight, fX, fY) {
    var i, aX, aY, aHeight, aWidth;

    aX = sX;
    aY = sY;
    aHeight = 0;
    aWidth = 0;

//    w.setPosition(sX, sY)
    w.setBounds({width: 0, height: 0, x: sX, y:sY});

    for (i = 0; i < num; i++) {
        aX -= (sX - fX) / num;
        aY -= (sY - fY) / num;
        aHeight += fHeight / num;
        aWidth += fWidth / num;

        w.setBounds({
            width: Math.floor(aWidth), 
            height: Math.floor(aHeight), 
            x: Math.floor(aX), 
            y:Math.floor(aY)
        });

//        sleep(50);
    }
}



function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}
