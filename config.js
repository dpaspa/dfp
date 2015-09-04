/**---------------------------------------------------------------------------*/
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the configuration file for the dfp (desktop focal point) client   */
/** preferences settings.                                                     */
/*----------------------------------------------------------------------------*/
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       30-Aug-2015 NA   Initial design.                    */
/**---------------------------------------------------------------------------*/
module.exports = {
    /*------------------------------------------------------------------------*/
    /** Users local preferences:                                              */
    /*------------------------------------------------------------------------*/
    timezone: 'Asia/Singapore',             // Users local timezone

    /*------------------------------------------------------------------------*/
    /** Web locations and services:                                           */
    /*------------------------------------------------------------------------*/
    uriAPI: 'http://localhost:8888/api/',   // The phembot API URL for MongoDB
    website: 'http://ipoogi.com',           // ipoogi company website
    feedback: 'http://ipoogi.com',          // Chat URL

    /*------------------------------------------------------------------------*/
    /** Appliction paths:                                                     */
    /*------------------------------------------------------------------------*/
    pathLogo: 'q:/logo.png',                // Global logo image
    pathWord: '"C:/Program Files/Microsoft Office/Office14/winword"', 
                                            // Path to MS Word executable
    pathEffector: 'q:/effectors/pb.dotm',   // Path to effector
    path2ndMsngrs: 'q:/effectors/',         // Path to secondary messengers
//    pathFiles: 'q:/files/',                 // Path to local files
    pathFiles: '/home/dpaspa/Dropbox/Business/aka/qms',// Path to local files
    pathPhembots: 'q:/phembots/'            // Path to local phembot store
}
