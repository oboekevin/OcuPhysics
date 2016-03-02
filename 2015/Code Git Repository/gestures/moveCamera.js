'use strict';
var gestures = require('../gestures.js'),
    debug = require('../debug.js'),
    user = require('../user.js');

var GestureMoveCamera = function() {
    /** @const */
    this.id = 'MOVE_CAMERA';
    /** @const */
    this.type = gestures.gestureTypes.offHand;
    /** @const */
    this.MOVE_THRESHOLD = 50;

    this.initialPosition = undefined;
    var self = this;

    var moveCamera = function(hand) {
        var deltaPosition = Leap.vec3.create();
        Leap.vec3.sub(deltaPosition, hand.palmPosition, self.initialPosition);
        var delta = Leap.vec3.len(deltaPosition);
        if (delta > self.MOVE_THRESHOLD) {
            user.toggleGravity(false);
            Leap.vec3.normalize(deltaPosition, deltaPosition);
            Leap.vec3.scale(deltaPosition, deltaPosition, Math.pow(delta - self.MOVE_THRESHOLD, 2) / 5);
            user.setVelocity(deltaPosition);
        } else {
            // Disable smooth stop
            user.setVelocity([0, 0, 0]);
        }
        return true;
    };

    this.canActivate = function(hand) {
        return hand.sphereRadius < gestures.settings.triggerSphereRadius && !hand.indexFinger.extended;
    };

    this.activate = function(hand) {
        this.initialPosition = hand.palmPosition;
    };

    this.update = function(hand) {
        if (hand.sphereRadius > gestures.settings.triggerSphereRadius || hand.indexFinger.extended) {
            return false;
        }
        return moveCamera(hand);
    };

    this.deactivate = function() {
        this.initialPosition = undefined;
    }
};
exports = module.exports = new GestureMoveCamera();