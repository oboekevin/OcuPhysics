'use strict';

var events = require('events');

var listen = exports.listen = new events.EventEmitter(),
    pressedDown = [];

var isDown = exports.isDown = function(keyCode) {
    return pressedDown.indexOf(keyCode) !== -1;
};

document.addEventListener("DOMContentLoaded", function(event) {
    document.addEventListener('keydown', function(event) {
        if (isDown(event.keyCode)) {
            return;
        }
        pressedDown.push(event.keyCode);
        listen.emit('down', event.keyCode);
        console.log('emit ' + 'down:' + reverseMap[event.keyCode])
        listen.emit('down:' + reverseMap[event.keyCode], event.keyCode);
        event.preventDefault();
    }, false);

    document.addEventListener('keyup', function(event) {
        if (!isDown(event.keyCode)) {
            return;
        }
        var i;
        while ((i = pressedDown.indexOf(event.keyCode)) !== -1)
            pressedDown.splice(i, 1);
        listen.emit('up', event.keyCode);
        listen.emit('up:' + reverseMap[event.keyCode], event.keyCode);
        event.preventDefault();
    }, false);
});

// US keyboard layout
var map = exports.map = {
    backspace: 8,
    tab: 9,
    enter: 13,
    shift: 16,
    ctrl: 17,
    alt: 18,
    pauseBreak: 19,
    capsLock: 20,
    esc: 27,
    space: 32,
    pageUp: 33,
    pageDown: 34,
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    insert: 45,
    del: 46,
    k0: 48,
    k1: 49,
    k2: 50,
    k3: 51,
    k4: 52,
    k5: 53,
    k6: 54,
    k7: 55,
    k8: 56,
    k9: 57,
    kA: 65,
    kB: 66,
    kC: 67,
    kD: 68,
    kE: 69,
    kF: 70,
    kG: 71,
    kH: 72,
    kI: 73,
    kJ: 74,
    kK: 75,
    kL: 76,
    kM: 77,
    kN: 78,
    kO: 79,
    kP: 80,
    kQ: 81,
    kR: 82,
    kS: 83,
    kT: 84,
    kU: 85,
    kV: 86,
    kW: 87,
    kX: 88,
    kY: 89,
    kZ: 90,
    windows: 91,
    numpad0: 96,
    numpad1: 97,
    numpad2: 98,
    numpad3: 99,
    numpad4: 100,
    numpad5: 101,
    numpad6: 102,
    numpad7: 103,
    numpad8: 104,
    numpad9: 105,
    numpadStar: 106,
    numpadPlus: 107,
    numpadMinus: 109,
    numpadPeriod: 110,
    numpadSlash: 111,
    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    f9: 120,
    f10: 121,
    f11: 122,
    f12: 123,
    numLock: 144,
    scrollLock: 145,
    semicolon: 186,
    equals: 187,
    comma: 188,
    minus: 189,
    period: 190,
    slash: 191,
    backTick: 192,
    leftBracket: 219,
    backSlash: 220,
    rightBracket: 221,
    quote: 222
};

var reverseMap = exports.reverseMap = {};

for (var p in map) {
    if (map.hasOwnProperty(p)) {
        reverseMap[map[p]] = p;
    }
}
