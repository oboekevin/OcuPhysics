'use strict';

var gestures = require('../gestures.js'),
    debug = require('../debug.js'),
    gestureSelect = require('./select.js');

var GestureScale = function() {
    this.id = 'SCALE';
    this.type = gestures.gestureTypes.secondary;
    this.required = gestureSelect;

    this.initialHandPositions = {
        left: undefined,
        right: undefined
    };
    this.initialDist = undefined;
    this.initialObjScale = undefined;
    this.object = undefined;

    this.canActivate = function(secondaryHand) {
        return secondaryHand.sphereRadius < gestures.settings.triggerSphereRadius && secondaryHand.indexFinger.extended;
    };

    this.activate = function(primaryHand, secondaryHand, object) {
        this.initialHandPositions[primaryHand.type] = primaryHand.fingers[1].tipPosition;
        this.initialHandPositions[secondaryHand.type] = secondaryHand.fingers[1].tipPosition;
        this.initialDist = Leap.vec3.create();
        Leap.vec3.sub(this.initialDist, this.initialHandPositions[primaryHand.type], this.initialHandPositions[secondaryHand.type]);
        this.initialObjScale = Leap.vec3.fromValues(object.mesh.scale.x, object.mesh.scale.y, object.mesh.scale.z);
        this.object = object;
        this.required.lock = true;
    };

    this.update = function(primaryHand, secondaryHand) {
        if (secondaryHand.sphereRadius > gestures.settings.triggerSphereRadius || !secondaryHand.indexFinger.extended) {
            return false;
        }
        var deltaVector = Leap.vec3.create();
        // Calculate the vector that goes from primaryHand towards secondaryHand, with a magnitude
        // length equal to the difference between the current and initial magnitudes
        Leap.vec3.sub(deltaVector, primaryHand.fingers[1].tipPosition, secondaryHand.fingers[1].tipPosition);
        Leap.vec3.div(deltaVector, deltaVector, this.initialDist);
        Leap.vec3.mul(deltaVector, deltaVector, this.initialObjScale);
        // Prevent negative scales
        for (var i = 0; i < 3; i++) {
            if (deltaVector[i] < 0) {
                deltaVector[i] *= -1;
            }
        }
        this.object.mesh.scale.set(deltaVector[0], deltaVector[1], deltaVector[2]);
        debug.log('Resize to: {' + deltaVector[0] + ', ' + deltaVector[1] + ', ' + deltaVector[2] + '}');
        return true;
    };

    this.deactivate = function() {
        this.object = undefined;
        this.required.lock = false;
    }
};

exports = module.exports = new GestureScale();