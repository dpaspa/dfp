var config = require('./config');
var path = require('path');
var ipc = require('ipc');
var notifier = require('node-notifier');
var shell = require('shell');
var CronJob = require('cron').CronJob;
var moment = require('moment-timezone');
var dynamics = require('dynamics.js');

function renderFeedback() {
  var templateSource = document.getElementById('template-feedback').innerHTML;
  var template = Handlebars.compile(templateSource);
  var resultsPlaceholder = document.getElementById('result-feedback');
  resultsPlaceholder.innerHTML = template({
    feedback: config.feedback
  });
}

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

function callAPI(type, num, willNotify){
    var xhr = new XMLHttpRequest();
    xhr.onload = function(){
        var body = JSON.parse(this.responseText);
        var data = {};
        data[type] = body._items;

        if (type === 'phembots' && willNotify) {
            createNotification(data[type][0]);
        }

        data.website = config.website;
        data.feedback = config.feedback;
        renderTemplate(type, data);
    };
/*  xhr.open('GET', config.apiUrl + type, true); */

    if (type === 'phembots') {
        xhr.open('GET', config.apiUrl + 'phembots/' + num, true);
    } else {
        xhr.open('GET', config.apiUrl + 'lists/catalog/' + num, true);
    }
    xhr.send();
}

document.body.addEventListener('click', function(e){
  var el = e.target;
  if (!el) return;
  if (el.tagName.toLowerCase() == 'a' && el.target == '_blank'){
    e.preventDefault();
    shell.openExternal(el.href);
  }
});

document.getElementById('dyno').addEventListener('click', function() {
  document.getElementById('dyno').style.backgroundImage = 'url(./images/spiral-static.png)';
})

document.getElementById('dyno').addEventListener('drop', function(e) {
  document.getElementById('dyno').style.backgroundImage = 'url(./images/spiral-run-send.gif)';

  var dt = e.dataTransfer;
  var files = dt.files;

  var count = files.length;

  e.preventDefault();
  e.stopPropagation();


//  alert('landed on ' + e.target);

//  alert("File Count: " + count + "\n");

//    for (var i = 0; i < files.length; i++) {
//      alert("File " + i + ":\n(" + (typeof files[i]) + ") : <" + files[i] + " > " +
//             files[i].name + " " + files[i].size + "\n");
//    }
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

  document.getElementById('dyno').style.display = 'block';
  document.getElementById('cal-content').style.display = 'block';
  document.getElementById('prefs-content').style.display = 'none';
  document.getElementById('list-content').style.display = 'none';
  document.getElementById('task-content').style.display = 'none';
})

document.getElementById('prefs-label').addEventListener('click', function() {
//  document.getElementById('cal-label').style.backgroundColor = '#1f2023';
//  document.getElementById('prefs-label').style.backgroundColor = '#707070';
//  document.getElementById('list-label').style.backgroundColor = '#1f2023';
//  document.getElementById('task-label').style.backgroundColor = '#1f2023';

  document.getElementById('dyno').style.display = 'none';
  document.getElementById('cal-content').style.display = 'none';
  document.getElementById('prefs-content').style.display = 'block';
  document.getElementById('list-content').style.display = 'none';
  document.getElementById('task-content').style.display = 'none';
})

document.getElementById('list-label').addEventListener('click', function() {
//  document.getElementById('cal-label').style.backgroundColor = '#1f2023';
//  document.getElementById('prefs-label').style.backgroundColor = '#1f2023';
//  document.getElementById('list-label').style.backgroundColor = '#707070';
//  document.getElementById('task-label').style.backgroundColor = '#1f2023';

  document.getElementById('dyno').style.display = 'block';
  document.getElementById('cal-content').style.display = 'none';
  document.getElementById('prefs-content').style.display = 'none';
  document.getElementById('list-content').style.display = 'block';
  document.getElementById('task-content').style.display = 'none';
})

document.getElementById('task-label').addEventListener('click', function() {
//  document.getElementById('cal-label').style.backgroundColor = '#1f2023';
//  document.getElementById('prefs-label').style.backgroundColor = '#1f2023';
//  document.getElementById('list-label').style.backgroundColor = '#1f2023';
//  document.getElementById('task-label').style.backgroundColor = '#707070';

  document.getElementById('dyno').style.display = 'block';
  document.getElementById('cal-content').style.display = 'none';
  document.getElementById('prefs-content').style.display = 'none';
  document.getElementById('list-content').style.display = 'none';
  document.getElementById('task-content').style.display = 'block';
})

document.getElementById('user-label').addEventListener('click', function() {
//  ipc.sendSync('event', 'user');
//  ipc.sendSync('event', 'dyno');
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

    ipc.sendSync('event', 'user');
})

document.getElementById('dash-label').addEventListener('click', function() {
  ipc.sendSync('event', 'dash');
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


//  ipc.sendSync('event', 'dash');
//  shell.openExternal('http://dashingdemo.herokuapp.com/sample');
})

document.getElementById('quit').addEventListener('click', function() {
  ipc.sendSync('event', 'quit');
})

new CronJob('0 0,30 * * * *', function() {
  callAPI('phembots', 6, true);
  callAPI('lists', 3, true);
}, null, true, config.timezone);

renderFeedback();
callAPI('phembots', 6, false);
callAPI('lists', 3, false);

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
