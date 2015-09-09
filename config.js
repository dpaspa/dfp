/* -------------------------------------------------------------------------- */
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the configuration file for the dfp (desktop focal point) client   */
/** preferences settings.                                                     */
/* -------------------------------------------------------------------------- */
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       30-Aug-2015 NA   Initial design.                    */
/* -------------------------------------------------------------------------- */
module.exports = {
  /* ------------------------------------------------------------------------ */
  /** Users local preferences:                                                */
  /* ------------------------------------------------------------------------ */
  timezone: 'Asia/Singapore',           // Users local timezone

  /* ------------------------------------------------------------------------ */
  /** Web locations and services:                                             */
  /* ------------------------------------------------------------------------ */
  host: 'localhost',                    // The API host for MongoDB
  port: '8888',                         // The API port for MongoDB
  website: 'http://ipoogi.com',         // ipoogi company website
  feedback: 'http://ipoogi.com',        // Chat URL

  /* ------------------------------------------------------------------------ */
  /** Appliction paths (paths are relative to pathHome).                      */
  /** OS Native executables:                                                  */
  /* ------------------------------------------------------------------------ */
  pathOSExec: 'c:/',
  pathWrite: 'Program Files/Microsoft Office/Office14/winword',
  pathSheet: 'Program Files/Microsoft Office/Office14/excel',

  /* ------------------------------------------------------------------------ */
  /** Shared server Phembot paths:                                            */
  /* ------------------------------------------------------------------------ */
  pathHome: 'q:/',   // '/home/dpaspa/Dropbox/Business/aka/qms',
  pathLogo: 'logo.png',
  pathEffector: 'effectors',
  pathMessengers: 'effectors',
  fileEffector: 'pb.dotm',

  /* ------------------------------------------------------------------------ */
  /** Local Phembot and receptor queue paths:                                 */
  /* ------------------------------------------------------------------------ */
  pathReceptorsIn: 'receptors/in',
  pathReceptorsOut: 'receptors/out',
  pathPhembotsIn: 'effectors/in',
  pathPhembotsOut: 'effectors/out',
  pathReceptors: 'x:/business/ipoogi'
}
