/*----------------------------------------------------------------------------*/
/*                       Copyright © 2015 ipoogi.com                          */
/*                                                                            */
/** This file contains the dfp (desktop focal point) client configuration     */
/** settings.                                                                 */
/*----------------------------------------------------------------------------*/
/* Revision history:                                                          */
/* Ver By                Date        CC   Revision Note                       */
/* 1   David Paspa       30-Aug-2015 NA   Initial design.                     */
/*----------------------------------------------------------------------------*/
module.exports = {
    /*------------------------------------------------------------------------*/
    /** Users local preferences:                                              */
    /*------------------------------------------------------------------------*/
    timezone: 'Asia/Singapore',             // Users local timezone

    /*------------------------------------------------------------------------*/
    /** Web locations and services:                                           */
    /*------------------------------------------------------------------------*/
    apiUrl: 'http://localhost:8888/api/',   // The phembot API URL for MongoDB
    website: 'http://ipoogi.com',           // ipoogi company website
    feedback: 'http://ipoogi.com',          // Chat URL

    /*------------------------------------------------------------------------*/
    /** Appliction paths:                                                     */
    /*------------------------------------------------------------------------*/
    pathFiles: 'x:/Business/ipoogi/files',  // Local file store
    pathEffector: 'x:/Business/ipoogi/',    // Global effector templates

    /*------------------------------------------------------------------------*/
    /** MS Window format appliction paths:                                    */
    /*------------------------------------------------------------------------*/
    pathWinWord: '"C:\\Program\ Files\\Microsoft\ Office\\Office14\\winword"', 
                                            // Path to MS Word executable
    pathWinEffector: 'q:\\effectors\\pb.dotm',// Path to effector
    pathWin2ndMsngrs: 'q:\\effectors\\',    // Path to secondary messengers
    pathWinFiles: 'q:\\files\\',            // Path to local files
    pathWinPhembots: 'q:\\phembots\\'       // Path to local phembot store
}
