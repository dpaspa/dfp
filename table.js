/**---------------------------------------------------------------------------*/
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the dataTables script for the Electron application for the        */
/** dfp (desktop focal point) application. The dfp is the desktop client      */
/** application for integrating the user's workflows into the QMS back end.   */
/*----------------------------------------------------------------------------*/
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       04-Sep-2015 NA   Initial design.                    */
/**---------------------------------------------------------------------------*/
'use strict';

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from local application files:     */
/**---------------------------------------------------------------------------*/
var util = require('./util');

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from external node packages:      */
/**---------------------------------------------------------------------------*/
var ipc = require('ipc');

/**---------------------------------------------------------------------------*/
/** Process on JQuery's ready function once the page is loaded:               */
/**---------------------------------------------------------------------------*/
$(document).ready(function() {
    /**-----------------------------------------------------------------------*/
    /** Get the parameter in the uri:                                         */
    /**-----------------------------------------------------------------------*/
//    var uriParms = util.uriParameters();
//    console.log('\n\n display ' + uriParms.type + ' with id ' + uriParms.id + '\n\n');

    /**-----------------------------------------------------------------------*/
    /** Set the dataTables ajax properties for loading the data:              */
    /**-----------------------------------------------------------------------*/
    $.ajax({
        "url": './arrays.txt',
        "success": function (json) {
            $('#example').dataTable(json);
        },
        "dataType": "json"
    });


    /**-----------------------------------------------------------------------*/
    /** Set up the list item selection click event:                           */
    /**-----------------------------------------------------------------------*/
/*    var atable = $('#dtable').DataTable();
    $('#dtable tbody').on( 'click', 'tr', function () {
        if ( $(this).hasClass('selected') ) {
            $(this).removeClass('selected');
        }
        else {
            atable.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });
*/

    /**-----------------------------------------------------------------------*/
    /** Process the data send event:                                          */
    /**-----------------------------------------------------------------------*/
/*    ipc.on('tableView', function(data) {
        console.log(data);
    });
    */
});

/**---------------------------------------------------------------------------*/
/** Close button has been clicked. Send the event to the browser side to hide */
/** the window:                                                               */
/**---------------------------------------------------------------------------*/
function windowClose() {
    ipc.send('datatableClose');
}
