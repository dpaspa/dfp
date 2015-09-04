var config = require('./config');
var drop = require('./drop');
var path = require('path');
var ipc = require('ipc');
var notifier = require('node-notifier');
var shell = require('shell');
var schedule = require('node-schedule');
var moment = require('moment-timezone');
var dynamics = require('dynamics.js');
var fs = require('fs');
var xml2js = require('xml2js');
var watch = require('watch');
var io = require('socket.io');

/* function renderFeedback() {
  var templateSource = document.getElementById('template-feedback').innerHTML;
  var template = Handlebars.compile(templateSource);
  var resultsPlaceholder = document.getElementById('result-feedback');
  resultsPlaceholder.innerHTML = template({
    feedback: config.feedback
  });
} */

function renderTemplate(type, data) {
  var templateSource = document.getElementById('template-' + type).innerHTML;
  var template = Handlebars.compile(templateSource);
  var resultsPlaceholder = document.getElementById('result-' + type);
  resultsPlaceholder.innerHTML = template(data);
}

// a limited 'each' loop.
// usage: {{#limit items offset="1" limit="5"}} : items 1 thru 6
// usage: {{#limit items limit="10"}} : items 0 thru 9
// usage: {{#limit items offset="3"}} : items 3 thru context.length
// defaults are offset=0, limit=5
/*Handlebars.registerHelper('limit', function(context, block) {
  var ret = "",
      offset = parseInt(block.hash.offset) || 0,
      limit = parseInt(block.hash.limit) || 5,
      i = (offset < context.length) ? offset : 0,
      j = ((limit + offset) < context.length) ? (limit + offset) : context.length;

  for(i,j; i<j; i++) {
    ret += block(context[i]);
  }

  return ret;
}); */

function isWithinAnHour(startTime) {
  return moment(startTime, 'DD MMM YYYY, ddd, hh:mm a').isBefore(moment().add(1, 'hour'))
}

function createNotification(upcomingEvent) {
  // if upcoming event starts within the next hour,
  // create a notification
  if (isWithinAnHour(upcomingEvent.formatted_time)) {
    notifier.notify({
      'title': upcomingEvent.name,
      'message': 'by ' + upcomingEvent.group_name + ' on ' + upcomingEvent.formatted_time,
      'icon': path.join(__dirname, 'logo.png'),
      'wait': true,
      'open': upcomingEvent.url
    });
  }
}

function getAPI(type, num, willNotify){
    var uri;
    var xhr = new XMLHttpRequest();

    if (type === 'phembot') {
        uri = config.apiUrl + 'phembot/' + num;

    } else {
        uri = config.apiUrl + 'list/catalog/' + num;
    }

    xhr.onload = function(){
        var body = JSON.parse(this.responseText);
        var data = {};
        data[type] = body._items;

        data['listURI'] = 'file:///home/dpaspa/Dropbox/Business/ipoogi/development/electron/table.html';
        if (type === 'phembot' && willNotify) {
            createNotification(data);
        }

//        data['website'] = config.website;
        renderTemplate(type, data);
    };

    xhr.open('GET', uri, true);
    xhr.send();
}

function postAPI(type, item){
    var uri;
    var xhr = new XMLHttpRequest();

    if (type === 'phembot') {
        uri = config.apiUrl + 'phembot';
    } else {
        uri = config.apiUrl + 'list';
    }

    xhr.onload = function(){
        var body = JSON.parse(this.responseText);
    };

    xhr.open('POST', uri, true);
    xhr.send(item);
}

document.body.addEventListener('click', function(e){
    var el = e.target;
    if (!el) return;

    var ref = el.target;
    if (!ref) return;

//    if (el.tagName.toLowerCase() == 'a' && el.target == '_blank') {
    e.preventDefault();
//    shell.openExternal(el.href + '&ref=list%id=' + ref.substring(6));

    var delimChar = ref.indexOf("_");
    if (ref.substring(0, delimChar) == 'list') {
        ipc.send('event', ref);

    } else if (ref.substring(0, delimChar) == 'phembot') {
        ipc.send('event', ref);
    }
});

document.getElementById('dyno').addEventListener('click', function() {
  document.getElementById('dyno').style.backgroundImage = 'url(./images/spiral-static.png)';
})

document.getElementById('dyno').addEventListener('drop', function(e) {
    drop.processDrop(e);
});

document.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
});
//webview.addEventListener('dragover', function(e) {
//  e.preventDefault();
//});




document.getElementById('cal-label').addEventListener('click', function() {
//  document.getElementById('cal-label').style.backgroundColor = '#707070';
//  document.getElementById('prefs-label').style.backgroundColor = '#1f2023';
//  document.getElementById('list-label').style.backgroundColor = '#1f2023';
//  document.getElementById('task-label').style.backgroundColor = '#1f2023';

//  document.getElementById('dyno').style.display = 'block';
//  document.getElementById('cal-content').style.display = 'block';
//  document.getElementById('prefs-content').style.display = 'none';
//  document.getElementById('list-content').style.display = 'none';
//  document.getElementById('task-content').style.display = 'none';
  ipc.send('event', 'cal');
})

document.getElementById('chat-label').addEventListener('click', function() {
  document.getElementById('chat').style.display = 'block';
  document.getElementById('dyno').style.display = 'none';

//  ipc.send('event', 'chat');
})

document.getElementById('m-send').addEventListener('click', function() {
//        var socket = new io.Socket();
        var socket = io();
        var chatter = document.getElementById('m').value;
        socket.emit('chat message', chatter);
        socket.send(chatter);
        document.getElementById('m').value = '';
//        document.getElementById('messages').append($('<li>').text(msg));
        var newElement = document.createElement('li');
        newElement.innerHTML = chatter;
        document.getElementById("messages").appendChild(newElement);
})

document.getElementById('search-key').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
        var searchText = document.getElementById('search-key').value;
//        ipc.send('event', 'chunk');
        var remote = require('remote');
        var BrowserWindow = remote.require('browser-window');
        var chunkWindow = new BrowserWindow({ 
            "skip-taskbar": true,
            frame: false,
            transparent: true,
            width: 800, 
            height: 600 
        });
        chunkWindow.setPosition(200, 100);
        chunkWindow.loadUrl('file://' + __dirname + '/chunk.html?search=' + searchText);
    }
})

document.getElementById('prefs-label').addEventListener('click', function() {
//  document.getElementById('cal-label').style.backgroundColor = '#1f2023';
//  document.getElementById('prefs-label').style.backgroundColor = '#707070';
//  document.getElementById('list-label').style.backgroundColor = '#1f2023';
//  document.getElementById('task-label').style.backgroundColor = '#1f2023';

  document.getElementById('chat').style.display = 'none';
  document.getElementById('dyno').style.display = 'none';
  document.getElementById('searcher').style.display = 'none';
//  document.getElementById('cal-content').style.display = 'none';
  document.getElementById('prefs-content').style.display = 'block';
  document.getElementById('prefs-instr').style.display = 'block';
  document.getElementById('improve-content').style.display = 'none';
  document.getElementById('list-content').style.display = 'none';
  document.getElementById('task-content').style.display = 'none';
})

document.getElementById('improve-label').addEventListener('click', function() {
  document.getElementById('chat').style.display = 'none';
  document.getElementById('dyno').style.display = 'block';
  document.getElementById('searcher').style.display = 'block';
  document.getElementById('prefs-content').style.display = 'none';
  document.getElementById('prefs-instr').style.display = 'none';
  document.getElementById('improve-content').style.display = 'block';
  document.getElementById('list-content').style.display = 'none';
  document.getElementById('task-content').style.display = 'none';
})

document.getElementById('list-label').addEventListener('click', function() {
//  document.getElementById('cal-label').style.backgroundColor = '#1f2023';
//  document.getElementById('prefs-label').style.backgroundColor = '#1f2023';
//  document.getElementById('list-label').style.backgroundColor = '#707070';
//  document.getElementById('task-label').style.backgroundColor = '#1f2023';

  document.getElementById('chat').style.display = 'none';
  document.getElementById('dyno').style.display = 'block';
  document.getElementById('searcher').style.display = 'block';
//  document.getElementById('cal-content').style.display = 'none';
  document.getElementById('prefs-content').style.display = 'none';
  document.getElementById('prefs-instr').style.display = 'none';
  document.getElementById('improve-content').style.display = 'none';
  document.getElementById('list-content').style.display = 'block';
  document.getElementById('task-content').style.display = 'none';
})

document.getElementById('task-label').addEventListener('click', function() {
//  document.getElementById('cal-label').style.backgroundColor = '#1f2023';
//  document.getElementById('prefs-label').style.backgroundColor = '#1f2023';
//  document.getElementById('list-label').style.backgroundColor = '#1f2023';
//  document.getElementById('task-label').style.backgroundColor = '#707070';

  document.getElementById('chat').style.display = 'none';
  document.getElementById('dyno').style.display = 'block';
  document.getElementById('searcher').style.display = 'block';
//  document.getElementById('cal-content').style.display = 'none';
  document.getElementById('prefs-content').style.display = 'none';
  document.getElementById('prefs-instr').style.display = 'none';
  document.getElementById('improve-content').style.display = 'none';
  document.getElementById('list-content').style.display = 'none';
  document.getElementById('task-content').style.display = 'block';
})

document.getElementById('user-label').addEventListener('click', function() {
    var el = document.getElementById("user-label")
    dynamics.animate(el, {
        translateX: -250,
        scale: 2,
        opacity: 0.5
    }, {
        type: dynamics.spring,
        frequency: 200,
        friction: 200,
        duration: 1500
    })

//    ipc.send('event', 'user');
})

document.getElementById('dash-label').addEventListener('click', function() {
  ipc.send('event', 'dash');
//  if (document.getElementById("dash-content").style.width === '600px') 
//     {
//      document.getElementById("dash-content").style.width = '0';
//      document.getElementById("dash-content").style.height = '0';
//     }
//  else
//     {
//      document.getElementById("dash-content").style.width = '600px';
//      document.getElementById("dash-content").style.height = '100%';
//     }

//  document.getElementById("dash-content").style.display = 'block') 


//  ipc.send('event', 'dash');
//  shell.openExternal('http://dashingdemo.herokuapp.com/sample');
})

document.getElementById('quit').addEventListener('click', function() {
  ipc.send('event', 'quit');
})

/*
schedule.scheduleJob('30 * * * * *', function(){
    console.log('The answer to life, the universe, and everything!');
    getAPI('phembot', 6, true);
    getAPI('list', 3, true);
});
*/

var rule = new schedule.RecurrenceRule();
rule.second = [0, 30];

schedule.scheduleJob(rule, function(){
    getAPI('phembot', 6, true);
    getAPI('list', 4, true);
//    console.log('The answer to life, the universe, and everything!');
});


// renderFeedback();
getAPI('phembot', 6, false);
getAPI('list', 4, false);


watch.watchTree(config.pathFiles, function (f, curr, prev) {
//    console.log('Now watching ' + config.pathFiles);
    // Finished walking the tree
    if (typeof f == "object" && prev === null && curr === null) {

    // f is a new file
    } else if (prev === null) {
        console.log(f + ' is new');
        var parser = new xml2js.Parser();
        fs.readFile(f, function(err, data) {
            postAPI('list', data);
        });

    // f was removed
    } else if (curr.nlink === 0) {
    } else {
        // f was changed
        console.log(f + ' changed');
    }
});

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
