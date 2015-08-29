// based on:
// https://gist.github.com/paulbbauer/2add0bdf0f4342df48ea
// http://iamemmanouil.com/blog/electron-oauth-with-github/
// https://github.com/ekonstantinidis/gitify

// this version uses https rather than superagent

var querystring = require('querystring');
var https = require("https");

<script src="https://apis.google.com/js/client.js?onload=checkAuth">

mainWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {
    var raw_code = /code=([^&]*)/.exec(newUrl) || null,
    code = (raw_code && raw_code.length > 1) ? raw_code[1] : null,
    error = /\?error=(.+)$/.exec(newUrl);
}   
            /* Your Client ID can be retrieved from your project in the Google */
            /* Developer Console, https://console.developers.google.com */
            var CLIENT_ID = '818711560460-ocobmj32fqklf9nd04mqjqerloc2qhnk.apps.googleusercontent.com';
            /* secret 1Runtywm59xTHd5z8EWznmzd */

            var SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

            /* Check if current user has authorized this application.  */
            function checkAuth() {
                gapi.auth.authorize(
                    {
                        'client_id': CLIENT_ID,
                        'scope': SCOPES,
                        'immediate': true
                    }, handleAuthResult
                );
            }

            /* Handle response from authorization server.  @param {Object} authResult Authorization result.  */
            function handleAuthResult(authResult) {
                var authorizeDiv = document.getElementById('authorize-div');
                if (authResult && !authResult.error) {
                    /* Hide auth UI, then load client library. */
                    authorizeDiv.style.display = 'none';
                    loadCalendarApi();
                } else {
                    /* Show auth UI, allowing the user to initiate authorization by clicking authorize button. */
                    authorizeDiv.style.display = 'inline';
                }
            }

            /* Initiate auth flow in response to user clicking authorize button. @param {Event} event Button click event.  */
            function handleAuthClick(event) {
                gapi.auth.authorize(
                    {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
                    handleAuthResult
                );
                return false;
           }

            /* Load Google Calendar client library. List upcoming events once client library is loaded.  */
            function loadCalendarApi() {
                gapi.client.load('calendar', 'v3', listUpcomingEvents);
            }

            /* Print the summary and start datetime/date of the next ten events in */
            /* the authorized user's calendar. If no events are found an appropriate message is printed. */
            function listUpcomingEvents() {
                var request = gapi.client.calendar.events.list({
                    'calendarId': 'primary',
                    'timeMin': (new Date()).toISOString(),
                    'showDeleted': false,
                    'singleEvents': true,
                    'maxResults': 10,
                    'orderBy': 'startTime'
                });

                request.execute(function(resp) {
                    var events = resp.items;
                    appendPre('Upcoming events:');

                    if (events.length > 0) {
                        for (i = 0; i < events.length; i++) {
                            var event = events[i];
                            var when = event.start.dateTime;
                            if (!when) {
                                when = event.start.date;
                            }
                        appendPre(event.summary + ' (' + when + ')')
                        }
                    } else {
                        appendPre('No upcoming events found.');
                    }
                });
            } 
            
            /*Append a pre element to the body containing the given message as its text node. */
            /* @param {string} message Text to be placed in pre element. */
            function appendPre(message) {
                var pre = document.getElementById('output');
                var textContent = document.createTextNode(message + '\n');
                pre.appendChild(textContent);
            }
