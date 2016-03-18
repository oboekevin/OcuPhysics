'use strict';

var libovr = require('./node-ovrsdk'),
    debug = require('./debug.js');

libovr.ovr_Initialize();

var numHmds = libovr.ovrHmd_Detect();

console.log('Found ' + numHmds + ' HMD(s)');
exports.hmdAttached = numHmds > 0;

if (exports.hmdAttached) {
    debug.log('HMD attached!', 'green');
    var hmd = libovr.ovrHmd_Create(0);
    var desc = new libovr.ovrHmdDesc;
    libovr.ovrHmd_GetDesc(hmd, desc.ref());
    libovr.ovrHmd_StartSensor(hmd, libovr.ovrSensorCap_Orientation, libovr.ovrSensorCap_Orientation);

    exports.getRotation = function(q) {
        var d = libovr.ovrHmd_GetSensorState(hmd, libovr.ovr_GetTimeInSeconds()).Predicted.Pose.Orientation;
        q.set(d.x, d.y, d.z, d.w);
    };
} else {
    debug.log('No HMD, assuming dev mode', 'red');
    exports.getRotation = function(q) {
        q.set(0, 0, 0);
    };
}