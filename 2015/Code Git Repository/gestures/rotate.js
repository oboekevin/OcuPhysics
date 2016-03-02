'use strict';

var gestures = require('../gestures.js'),
    debug = require('../debug.js'),
    renderer = require('../renderer.js'),
    gestureSelect = require('./select.js');

var GestureRotate = function() {
    this.id = 'ROTATE';
    this.type = gestures.gestureTypes.secondary;
    this.required = gestureSelect;

    this.prevPosition = undefined;
    this.prevPitch = undefined;
    this.axes = {
        x: undefined,
        y: undefined,
        z: undefined
    };
    this.object = undefined;

    this.canActivate = function(_, primaryHand) {
        return primaryHand.middleFinger.extended;
    };

    this.activate = function(primaryHand, secondaryHand, object) {
        this.prevPosition = primaryHand.palmPosition;
        this.prevPitch = primaryHand.pitch(); // angle in radians
        var cameraRotation = new THREE.Matrix4().extractRotation(renderer.camera.matrix);
        var objectRotation = new THREE.Matrix4().extractRotation(object.mesh.matrix);
        // TODO: get these axes to adjust to object rotation properly
        this.axes.x = new THREE.Vector3(1, 0, 0).applyMatrix4(cameraRotation).applyMatrix4(objectRotation);
        this.axes.y = new THREE.Vector3(0, 1, 0).applyMatrix4(cameraRotation).applyMatrix4(objectRotation);
        this.axes.z = new THREE.Vector3(0, 0, 1).applyMatrix4(cameraRotation).applyMatrix4(objectRotation);
        this.object = object;
        this.required.lock = true;
    };

    this.update = function(primaryHand) {
        var deltaPosition = Leap.vec3.create();
        Leap.vec3.sub(deltaPosition, this.prevPosition, primaryHand.palmPosition);
        // TODO: tweak scaling values... pitch is 1-to-1 while other axes are really fast
        this.object.mesh.rotateOnAxis(this.axes.y, deltaPosition[0] * Math.PI / 100);
        this.object.mesh.rotateOnAxis(this.axes.z, deltaPosition[1] * Math.PI / 100);
        this.object.mesh.rotateOnAxis(this.axes.x, primaryHand.pitch() - this.prevPitch);
        this.prevPosition = primaryHand.palmPosition;
        this.prevPitch = primaryHand.pitch();
        return primaryHand.middleFinger.extended;
    };

    this.deactivate = function() {
        this.prevPosition = undefined;
        this.prevPitch = undefined;
        this.axes.x = undefined;
        this.axes.y = undefined;
        this.axes.z = undefined;
        this.object = undefined;
        this.required.lock = false;
    }
};

exports = module.exports = new GestureRotate();