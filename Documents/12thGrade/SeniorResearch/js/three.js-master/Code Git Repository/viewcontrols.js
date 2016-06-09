'use strict';

var oculus = require('./oculus.js'),
    renderer = require('./renderer.js'),
    objects = require('./objects.js');


function lockPointerSetup() {
    // http://www.html5rocks.com/en/tutorials/pointerlock/intro/
    var havePointerLock = 'pointerLockElement' in document || 'webkitPointerLockElement' in document;
    var element = document.body;
    if (havePointerLock) {
        element.addEventListener('click', function (event) {
            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }, false);
    } else {
        element.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API :<';
    }
}

var controls = new objects.Entity('controls');
if (oculus.hmdAttached) {
    console.log('HMD attached, initializing head tracking', 'color: green');
    controls.on('init', function () {
        this.pose = new THREE.Quaternion();
    });
    controls.on('update', function(dt) {
        oculus.getRotation(this.pose);
        renderer.camera.quaternion.set(this.pose.x, this.pose.y, this.pose.z, this.pose.w); // lazy way :~) (yes could get rid of pose but meh)
    });
} else {
    console.warn('HMD not attached, initializing mouse controls');
    controls.on('init', function () {
        renderer.camera.rotation.order = 'YXZ';
        renderer.camera.rotation.set(0, 0, 0);
        lockPointerSetup();

        var self = this;
        document.addEventListener('mousemove', function (event) {
            self.emit('mousemove', event.movementX || event.webkitMovementX || 0, event.movementY || event.webkitMovementY || 0);
        }, false);
    });
    controls.on('mousemove', function (dx, dy) {
        this.once('update', function (dt) {
            renderer.camera.rotation.y -= dx * 0.2 * dt;
            renderer.camera.rotation.x -= dy * 0.2 * dt;
            renderer.camera.rotation.x = Math.max(-Math.PI / 2 * 0.9, Math.min(Math.PI / 2 * 0.9, renderer.camera.rotation.x));
        });
    });
}