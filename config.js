/* -------------------------------------------------------------------------- */
/**                       Copyright © 2015 ipoogi.com                         */
/**                                                                           */
/** This is the configuration file for the dfp (desktop focal point) client   */
/** preferences settings.                                                     */
/** var os = require('os');                                                   */
/** os.platform();                                                            */
/**  'linux' on Linux                                                         */
/**  'win32' on Windows 32-bit                                                */
/**  'win64' on Windows 64-bit                                                */
/**  'darwin' on OSX                                                          */
/** os.arch();                                                                */
/**  'x86' on 32-bit CPU architecture                                         */
/**  'x64' on 64-bit CPU architecture                                         */
/** var homedir = (process.platform === 'win32')                              */
/**                                ? process.env.HOMEPATH : process.env.HOME; */
/* -------------------------------------------------------------------------- */
/** Revision history:                                                         */
/** Ver By                Date        CC   Revision Note                      */
/** 1   David Paspa       30-Aug-2015 NA   Initial design.                    */
/* -------------------------------------------------------------------------- */

/**---------------------------------------------------------------------------*/
/** Declare module level variables included from other node packages:         */
/**---------------------------------------------------------------------------*/
var os = require('os');

/*----------------------------------------------------------------------------*/
/** Process according to operating system platform:                           */
/*----------------------------------------------------------------------------*/
var osName = os.platform();
switch (osName) {
    /*------------------------------------------------------------------------*/
    /** Linux distributions:                                                  */
    /*------------------------------------------------------------------------*/
    case ('linux'):
        /*--------------------------------------------------------------------*/
        /** Web locations and services:                                       */
        /*--------------------------------------------------------------------*/
        var serverHost = 'localhost';         // The API host for MongoDB

        /*--------------------------------------------------------------------*/
        /** Application paths:                                                */
        /*--------------------------------------------------------------------*/
        var pathAppWrite = '/usr/bin/lowriter';
        var pathAppSheet = '/usr/bin/localc';

        /*--------------------------------------------------------------------*/
        /** Remote shared server file and local desktop file locations:       */
        /*--------------------------------------------------------------------*/
        var pathFileLocal = '/home/dpaspa/Dropbox/Business/ipoogi/files';
        var pathFileRemote = '/home/dpaspa/Dropbox/Business/ipoogi/qms';
        break;

    /*------------------------------------------------------------------------*/
    /** Apple Mac OSX:                                                        */
    /*------------------------------------------------------------------------*/
    case ('darwin'):
        /*--------------------------------------------------------------------*/
        /** Web locations and services:                                       */
        /*--------------------------------------------------------------------*/
        var serverHost = '192.168.56.1';      // The API host for MongoDB

        /*--------------------------------------------------------------------*/
        /** Remote shared server file and local desktop file locations:       */
        /*--------------------------------------------------------------------*/
        var pathFileLocal = '/home/dpaspa/Dropbox/Business/ipoogi/files';
        var pathFileRemote = '/home/dpaspa/Dropbox/Business/ipoogi/qms';
        break;

    /*------------------------------------------------------------------------*/
    /** Microsoft Windows flavours:                                           */
    /*------------------------------------------------------------------------*/
    case ('win32'):
    case ('win64'):
        /*--------------------------------------------------------------------*/
        /** Web locations and services:                                       */
        /*--------------------------------------------------------------------*/
        var serverHost = '192.168.56.1';      // The API host for MongoDB

        /*--------------------------------------------------------------------*/
        /** Application paths:                                                */
        /*--------------------------------------------------------------------*/
        var pathAppWrite = 'c:/Program Files/Microsoft Office/Office14/winword';
        var pathAppSheet = 'c:/Program Files/Microsoft Office/Office14/excel';

        /*--------------------------------------------------------------------*/
        /** Remote shared server file and local desktop file locations:       */
        /*--------------------------------------------------------------------*/
        var pathFileLocal = 'x:/business/ipoogi/files';
        var pathFileRemote = 'x:/Business/ipoogi/qms';
        break;
}

/**---------------------------------------------------------------------------*/
/** Export the user specific configuration settings:                          */
/**---------------------------------------------------------------------------*/
module.exports = {
    /*------------------------------------------------------------------------*/
    /** Users local preferences:                                              */
    /*------------------------------------------------------------------------*/
    timezone: 'Asia/Singapore',        // Users local timezone
                                        
    /*------------------------------------------------------------------------*/
    /** More server addresses and ports:                                      */
    /*------------------------------------------------------------------------*/
    host: serverHost,
    port: '8888',                         // The API port for MongoDB
    website: 'http://ipoogi.com',         // ipoogi company website
    feedback: 'http://ipoogi.com',        // Chat URL

    /*------------------------------------------------------------------------*/
    /** Application paths:                                                    */
    /*------------------------------------------------------------------------*/
    pathWrite: pathAppWrite,
    pathSheet: pathAppSheet,

    /*------------------------------------------------------------------------*/
    /** Local Phembot and receptor queue paths:                               */
    /*------------------------------------------------------------------------*/
    pathLocal: pathFileLocal,
    pathLocalEffectorsIn: 'in/effectors',
    pathLocalEffectorsOut: 'out/effectors',
    pathLocalPhembotsIn: 'in/phembots',
    pathLocalPhembotsOut: 'out/phembots',
    pathLocalReceptorsIn: 'in/receptors',
    pathLocalReceptorsOut: 'out/receptors',

    /*------------------------------------------------------------------------*/
    /** Shared server Phembot paths:                                          */
    /*------------------------------------------------------------------------*/
    pathRemote: pathFileRemote,
    pathRemoteLogo: 'logo.png',
    pathRemoteEffectors: 'effectors',
    pathRemoteMessengers: 'effectors',
    pathRemotePhembots: 'phembots',
    pathRemoteReceptors: 'receptors',
    fileRemoteEffector: 'pb.dotm'
}
