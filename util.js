/*function uriParameters() {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
    return query_string;
}
*/

/*        var chunkKey = getParameterByName('search');
        document.getElementById('search-content').innerHTML = 'Search results for ' + chunkKey;

        function getParameterByName(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }
*/

exports.getURIParameter = function (name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

exports.getTimeStamp = function () {
    if (Date.now) {
        return Math.floor(Date.now() / 1000);
    }
    else {
        return Math.floor (new Date().getTime() / 1000);
    }
}

exports.getOSName = function () {
    var OSName="Unknown OS";

    if (navigator.appVersion.indexOf("Win") != -1) {
        return OSName = "Windows";
    }

    else if (navigator.appVersion.indexOf("Mac") != -1) {
        return OSName = "MacOS";
    }

    else if (navigator.appVersion.indexOf("X11") != -1) {
        return OSName = "UNIX";
    }

    else if (navigator.appVersion.indexOf("Linux") != -1) {
        return OSName = "Linux";
    }
}
