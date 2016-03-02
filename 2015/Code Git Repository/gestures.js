'use strict';

var menu = require('./menu.js'),
    objects = require('./objects.js'),
    events = require('events'),
    debug = require('./debug.js'),
    user = require('./user.js');

var listen = exports.listen = new events.EventEmitter();

var MIN_CONFIDENCE = 0.1, // bail if leap is less certain than this on hand recognition
    /** @type {string} */
    lastNotification,
    lastNumberOfHands,
    /** @type {Gesture[]} */
    activeGesture = {
        primary: undefined,
        secondary: undefined
    },
    /** @type {int} */
    handId,
    /** @type {int} */
    otherHandId,
    controllerOptions = {
        enableGestures: true
    };

var settings = exports.settings = {
    handedness: 'right',
    triggerSphereRadius: 50, // mm (~1.5 in), sphere corresponding to curvature of hand must be smaller than this
    innerTriggerThresholdRadius: 1.5,
    triggerThresholdRadius: 5
};

var gestureTypes = exports.gestureTypes = {
    onHand: {
        usePrimaryHand: true,
        isPrimaryGesture: true
    },
    offHand: {
        usePrimaryHand: false,
        isPrimaryGesture: true
    },
    secondary: {
        usePrimaryHand: true,
        isPrimaryGesture: false
    }
};

/*
 * primaryHand performs the first gesture, while secondaryHand performs the second gesture
 * primaryHand is by default the right hand (see settings[handedness])
 */

exports.getGestureId = function() {
    if (activeGesture.secondary) {
        return activeGesture.secondary.id;
    } else if (activeGesture.primary) {
        return activeGesture.primary.id;
    }
};

/**
 * Checks for frame validity and provides a hand array in the proper order
 * @param frame
 * @returns {{error: boolean, reason: string} | {error: boolean, hands: {number: 0 <= integer <= 2, primary: Leap.Hand, secondary: Leap.Hand}}}
 */
var getHandsById = function(frame) {
    if (!frame.valid) {
        return {
            error: true,
            reason: 'INVALID_FRAME'
        };
    } else if (frame.hands.length <= 0) {
        return {
            error: true,
            reason: 'NUM_HANDS'
        };
    }

    var hand = undefined;
    if (hand === undefined || !hand.valid) {
        var handTry = frame.hands.filter(function (h) {
            return h.type === settings.handedness;
        })[0];
        if (handTry) {
            // try to preserve the original hand object instead of overwriting it with undefined
            // so we can capture real hand validity problems that aren't caused by stale IDs
            hand = handTry;
        }
    }

    var otherHand = undefined;
    if (otherHand === undefined || !otherHand.valid) {
        var otherHandTry = frame.hands.filter(function (h) {
            return h.type !== settings.handedness;
        })[0];
        if (otherHandTry) {
            otherHand = otherHandTry;
        }
    }

    var handExists = hand !== undefined,
        otherHandExists = otherHand !== undefined;

    if ((handExists && !hand.valid) || (otherHandExists && !otherHand.valid)) {
        console.log('leap says hand not valid: ' + (handExists ? hand.valid : 'undef') + ', ' + (otherHandExists ? otherHand.valid : 'undef'));
        return {
            error: true,
            reason: 'INVALID_HAND'
        };
    } else if ((handExists && hand.confidence < MIN_CONFIDENCE) || (otherHandExists && otherHand.confidence < MIN_CONFIDENCE)) {
        return {
            error: true,
            reason: 'CONFIDENCE'
        };
    }

    return {
        error: false,
        hands: {
            number: !!hand + !!otherHand,
            primary: hand,
            secondary: otherHand
        }
    };
};

var activatePrimaryGesture = function (gesture, hand, otherHand) {
    debug.log('Activating primary gesture ' + gesture.id + ' on ' + hand.type + ' hand');
    listen.emit('activate:' + gesture.id);
    //handId = hand.id;
    //otherHandId = otherHand === undefined ? undefined : otherHand.id;
    activeGesture.primary = gesture;
    gesture.activate(hand);
};

var activateSecondaryGesture = function (gesture, hand, otherHand) {
    debug.log('Activating secondary gesture ' + gesture.id + ' with primary ' + activeGesture.primary.id);
    listen.emit('activate:' + gesture.id);
    activeGesture.secondary = gesture;
    otherHandId = otherHand.id;
    gesture.required.activateSecondary(gesture, hand, otherHand);
};

var cancelPrimaryGesture = function () {
    if (activeGesture.primary) {
        debug.log('Cancelling primary gesture ' + activeGesture.primary.id);
        activeGesture.primary.deactivate();
        activeGesture.primary = undefined;
    }
    //handId = undefined;
    //otherHandId = undefined;
};

var cancelSecondaryGesture = function () {
    if (activeGesture.secondary) {
        debug.log('Cancelling secondary gesture ' + activeGesture.secondary.id + ' bound to ' + activeGesture.primary.id);
        activeGesture.secondary.deactivate();
        activeGesture.secondary = undefined;
    }
};

var cancelGestures = function () {
    cancelSecondaryGesture();
    cancelPrimaryGesture();
};

/**
 * Detect and activate single-handed gestures
 * @param hands
 */
var checkSingleHandedGestures = function (hands) {
    primaryGestures.every(function (g) {
        var handsOrder = [ hands.primary, hands.secondary ];
        if (g.type.usePrimaryHand) {
            if (!hands.primary) {
                return true;
            }
        } else {
            if (!hands.secondary) {
                return true;
            }
            handsOrder = handsOrder.reverse();
        }
        if (g.canActivate.apply(g, handsOrder)) {
            activatePrimaryGesture.apply(null, [ g ].concat(handsOrder));
            return false; // stop iteration
        }
        return true; // continue
    });
};

/**
* Detect and activate two-handed gestures
* @param hands
*/
var checkDoubleHandedGestures = function (hands) {
    if (hands.number < 2) {
        return;
    }
    secondaryGestures.every(function (sg) {
        if (sg.required.id === activeGesture.primary.id && sg.required.canActivateSecondary(sg, hands.secondary, hands.primary)) {
            activateSecondaryGesture(sg, hands.primary, hands.secondary);
            return false; // Halt loop
        }
        return true;
    });
};

// Custom gestures to use
var enabledGestures = [
        require('./gestures/menu.js'),
        require('./gestures/select.js'),
        require('./gestures/move.js'),
        require('./gestures/scale.js'),
        require('./gestures/rotate.js'),
        require('./gestures/moveCamera.js')
    ],
    primaryGestures = [],
    secondaryGestures = [];

// Split primary and secondary gestures
enabledGestures.forEach(function (gesture) {
    if (gesture.required === undefined) {
        primaryGestures.push(gesture);
    } else {
        secondaryGestures.push(gesture);
    }
});

var updateGesture = function (gesture, hands) {
    if (gesture.type === gestureTypes.onHand) {
        return hands.primary !== undefined && gesture.update(hands.primary, hands.secondary);
    } else if (gesture.type === gestureTypes.offHand) {
        return hands.secondary !== undefined && gesture.update(hands.secondary, hands.primary);
    } else if (gesture.type === gestureTypes.secondary && hands.number >= 2) {
        return hands.primary !== undefined && hands.secondary !== undefined && gesture.update(hands.primary, hands.secondary);
    } else { // secondary and not enough hands
        return false; // cancel
    }
};

var updateGestures = function (hands) {
    if (activeGesture.primary) {
        if (!updateGesture(activeGesture.primary, hands)) {
            cancelGestures();
        } else if (activeGesture.secondary && !updateGesture(activeGesture.secondary, hands)) {
            cancelSecondaryGesture();
        }
    }
};

exports.initialize = function(scene, camera) {
    var controller = new Leap.Controller(controllerOptions).use('riggedHand', {
        parent: camera,
        camera: camera,
        scene: scene,
        scale: 0.02,
        positionScale: 0.05,
        // L/R, U/D, F/B
        offset: new THREE.Vector3(0, -200, -150),
        renderFn: function() {
            // we want to render ourselves so stub this out
        },
        // using boneLabels requires passing in the renderer
        boneColors: function(boneMesh, leapHand) {
            return {
                hue: 0,
                saturation: Math.max(0, Math.min(1, 1 - leapHand.confidence / (MIN_CONFIDENCE + .3)))
            };
        }
    });

    controller.connect();
    controller.on('frame', function(frame) {
        var result = getHandsById(frame);
        if (result.error) {
            if (result.reason == lastNotification) {
                return; // prevent spam
            }
            debug.warn({
                'INVALID_FRAME': 'Bad frame data from Leap, skipping!',
                'NUM_HANDS': 'Not enough hands in the frame, skipping!',
                'INVALID_HAND': 'Hand not valid, skipping!',
                'CONFIDENCE': 'Leap not sure where your hand is, skipping!'
            }[result.reason] || 'Unknown error ' + result.reason);
            lastNotification = result.reason;
            return;
        } else if (lastNotification) {
            debug.log('Error cleared, continuing!', 'green');
            lastNotification = undefined;
        }

        if (result.hands.number !== lastNumberOfHands) {
            listen.emit('handsnumber', lastNumberOfHands = result.hands.number);
        }

        updateGestures(result.hands);
        if (!activeGesture.primary) {
            checkSingleHandedGestures(result.hands);
        } else if (!activeGesture.secondary) {
            checkDoubleHandedGestures(result.hands);
        }
    });
};