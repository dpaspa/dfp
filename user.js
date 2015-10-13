/**---------------------------------------------------------------------------*/
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the browser script for the Electron application for the dfp       */
/** (desktop focal point) application. The dfp is the desktop client          */
/** application for integrating the user's workflows into the QMS back end.   */
/*----------------------------------------------------------------------------*/
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       01-Oct-2015 NA   Initial design.                    */
/**---------------------------------------------------------------------------*/
'use strict';

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from other application files:     */
/**---------------------------------------------------------------------------*/
var config = require('./config');
var util = require('./util');

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from other node packages:         */
/**---------------------------------------------------------------------------*/
var ipc = require('ipc');
var http = require('http');
var request = require('request');

/**---------------------------------------------------------------------------*/
/** Declare global program variables:                                         */
/**---------------------------------------------------------------------------*/
var loginAttemptCount = 0;

/******************************************************************************/
/**                                                                           */
/** EVENT LISTENERS   EVENT LISTENERS   EVENT LISTENERS   EVENT LISTENERS     */
/**                                                                           */
/** These set up the callbacks for the application user interation events.    */
/** Events are triggered on the html objects defined in index.html.           */
/******************************************************************************/

/**---------------------------------------------------------------------------*/
/** User quit instead of logging in:                                          */
/**---------------------------------------------------------------------------*/
document.getElementById('btn-login-cancel').addEventListener('click', function() {
    ipc.send('quit');
});

/**---------------------------------------------------------------------------*/
/** User login event:                                                         */
/**---------------------------------------------------------------------------*/
document.getElementById('btn-login-submit').addEventListener('click', function() {
    userLogin();
});
            
document.querySelector('[name="username"]').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        userLogin();
    }
});

document.querySelector('[name="password"]').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        userLogin();
    }
});

/**---------------------------------------------------------------------------*/
/** Function: userLogin                                                       */
/** Processes the user login event from the login button or enter key.        */
/**---------------------------------------------------------------------------*/
function userLogin() {
    /**-----------------------------------------------------------------------*/
    /** Get the user's name and password as entered into the login form:      */
    /**-----------------------------------------------------------------------*/
    var name = document.querySelector('[name="username"]').value;
    var password = document.querySelector('[name="password"]').value;

    /**-----------------------------------------------------------------------*/
    /** Check if the user is authorized to use the application:               */
    /**-----------------------------------------------------------------------*/
    authenticateUser(name, password, userIsAuthorised);
}

/**---------------------------------------------------------------------------*/
/** Function: userIsAuthorised                                                */
/** Sets the display of the application by showing or hiding things based on  */
/** whether the user is authorised or not.                                    */
/**                                                                           */
/** @param {string} isAllowed Whether the user is allowed access or not.      */
/**---------------------------------------------------------------------------*/
function userIsAuthorised(isAllowed) {
    if (isAllowed == 'true') {
        /**-------------------------------------------------------------------*/
        /** The login attmempt succeeded. Grant access:                       */
        /**-------------------------------------------------------------------*/
        document.getElementById('login-status').innerHTML = 'Login successful';
        ipc.send('userLoggedIn');
    }
    else {
        /**-------------------------------------------------------------------*/
        /** Display the login attempt failed message:                         */
        /**-------------------------------------------------------------------*/
        loginAttemptCount += 1;
        var s = 'Login unsuccessful after ' + loginAttemptCount + ' attempt';
        if (loginAttemptCount > 1) {
            s += 's';
        }
        if (loginAttemptCount > 2) {
            s += '.\n Notifying the system administrator.';
            ipc.send('userLoginUnsuccessful');
        }
        document.getElementById('login-status').innerHTML = s;
    }
};

/******************************************************************************/
/**                                                                           */
/** API DATA CALLS   API DATA CALLS   API DATA CALLS   API DATA CALLS   API   */
/**                                                                           */
/** Send and receive data to the mongoDB backend via the nodejs HTTP API.     */
/******************************************************************************/

/**---------------------------------------------------------------------------*/
/** Function: authenticateUser                                                */
/** Posts the user data to the server and gets the authorization status.      */
/**                                                                           */
/** @param {string} name     The user name entered in the login form.         */
/** @param {string} password The password entered in the login form.          */
/**---------------------------------------------------------------------------*/
function authenticateUser(name, password, callback) {
    /**-----------------------------------------------------------------------*/
    /** Create the user object:                                               */
    /**-----------------------------------------------------------------------*/
    var user = {};
    user['name'] = name;
    user['password'] = password;
    var body = JSON.stringify(user);

    /**-----------------------------------------------------------------------*/
    /** Set the API URI to post the data to:                                  */
    /**-----------------------------------------------------------------------*/
    var options = {
        uri: 'http://' + config.host + ':' + config.port + '/page/user/login',
        method: 'POST',
        headers: {},
        body: body
    };

    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(body);

    /**-----------------------------------------------------------------------*/
    /** Send the request:                                                     */
    /**-----------------------------------------------------------------------*/
    request.post(options, function (error, response) {
        if (typeof response === 'undefined'){
            document.getElementById('login-status').innerHTML = 
                'No reponse from server ' + 
                'http://' + config.host + ':' + config.port + '/page/user/login';
        }
        else if (typeof callback === 'function') {
            callback(response.body);
        }
    });
}
