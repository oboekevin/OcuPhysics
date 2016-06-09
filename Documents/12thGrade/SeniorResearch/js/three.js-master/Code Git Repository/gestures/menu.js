'use strict';

var gestures = require('../gestures.js'),
    debug = require('../debug.js'),
    objects = require('../objects.js'),
    renderer = require('../renderer.js');

var GestureMenu = function() {
    this.id = 'MENU';
    this.type = gestures.gestureTypes.offHand;

    var hasEnteredMenu = false;

    this.canActivate = function(hand) {
        return hand.sphereRadius < gestures.settings.triggerSphereRadius && hand.indexFinger.extended;
    };

    this.activate = function(hand) {
        hasEnteredMenu = false;
        gestures.listen.emit('menu:on');
    };

    var angleTo = function(v, mat) {
        var original = new THREE.Vector3(1, 0, 0).applyMatrix4(mat).angleTo(v),
            upRefAngle = new THREE.Vector3(0, 1, 0).applyMatrix4(mat).angleTo(v),
            dnRefAngle = new THREE.Vector3(0, -1, 0).applyMatrix4(mat).angleTo(v);
        return Math.PI + (upRefAngle >= dnRefAngle ? original : -original);
    };


    this.update = function(hand) {
        var position = hand.data('riggedHand.mesh').fingers[1].tip.getWorldPosition(),
            rotationMatrix = new THREE.Matrix4().extractRotation(renderer.camera.matrix),
            orthogonal = new THREE.Vector3(0, 0, 1).applyMatrix4(rotationMatrix),
            plane = new THREE.Plane().setFromNormalAndCoplanarPoint(orthogonal, renderer.camera.position),
            projection = plane.projectPoint(position).sub(renderer.camera.position);
        if (projection.length() > gestures.settings.triggerThresholdRadius) {
            if (hasEnteredMenu) {
                hasEnteredMenu = false;
                debug.log('select');
                gestures.listen.emit('menu:selectangle', angleTo(projection, rotationMatrix));
                gestures.listen.emit('menu:renderangle', undefined);
            }
        } else if (projection.length() > gestures.settings.innerTriggerThresholdRadius) {
            hasEnteredMenu = true;
            gestures.listen.emit('menu:renderangle', angleTo(projection, rotationMatrix));
        } else {
            gestures.listen.emit('menu:renderangle', undefined); // disable segment highlight
        }
        return hand.sphereRadius < gestures.settings.triggerSphereRadius && hand.indexFinger.extended;
    };

    this.deactivate = function() {
        gestures.listen.emit('menu:off');
    };
};

exports = module.exports = new GestureMenu();