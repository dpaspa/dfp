/**---------------------------------------------------------------------------*/
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the learning script for the Electron application for the          */
/** dfp (desktop focal point) application. The dfp is the desktop client      */
/** application for integrating the user's workflows into the QMS back end.   */
/*----------------------------------------------------------------------------*/
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       05-Sep-2015 NA   Initial design.                    */
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
/** Get the parameter in the uri:                                             */
/**---------------------------------------------------------------------------*/
var search = getURIParameter('search');
document.getElementById('chunk-content').innerHTML =  'Chunk for ' + search;

/**---------------------------------------------------------------------------*/
/** Close button has been clicked. Send the event to the browser side to hide */
/** the window:                                                               */
/**---------------------------------------------------------------------------*/
function windowClose() {
    ipc.send('learningClose');
}

function getURIParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}
