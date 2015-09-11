'use strict';

var keyboard = require('./keyboard.js'),
    objects = require('./objects.js'),
    renderer = require('./renderer.js');

var user = module.exports = exports = new objects.Entity('player');

user.on('init', function () {
    this.velocity = new THREE.Vector3();
    this.canJump = true;
    this.gravity = true;
    var self = this;
    keyboard.listen.on('down:space', function () {
        self.toggleGravity(true);
        if (self.canJump) {
            console.log('jumping!');
            self.velocity.y += 100;
            self.canJump = false;
        }
    });
});

user.on('update', function (dt) {
    var camera = renderer.camera;
    camera.quaternion.normalize();
    this.velocity.x /= 2;
    if (!this.gravity) {
        this.velocity.y /= 2;
    }
    this.velocity.z /= 2;
    var newVelocity = new THREE.Vector3();

    // Apply gravity, if 3D movement is disabled
    if (this.gravity && camera.position.y > 10) {
        this.velocity.y -= 9.8 * 30.0 * dt;
    }

    if (keyboard.isDown(keyboard.map.kW)) {
        newVelocity.z -= 50.0;
    } else if (keyboard.isDown(keyboard.map.kS)) {
        newVelocity.z += 50.0;
    }

    if (keyboard.isDown(keyboard.map.kA)) {
        newVelocity.x -= 50.0;
    } else if (keyboard.isDown(keyboard.map.kD)) {
        newVelocity.x += 50.0;
    }

    var quat = camera.quaternion.clone();
    newVelocity.applyQuaternion(quat);
    // If 3D movement is disabled set y = 0
    newVelocity.y = 0;
    this.velocity.add(newVelocity);

    if (Math.abs(this.velocity.x) < 1.0) {
        this.velocity.x = 0;
    }
    if (Math.abs(this.velocity.y) < 1.0) {
        this.velocity.y = 0;
    }
    if (Math.abs(this.velocity.z) < 1.0) {
        this.velocity.z = 0;
    }

    newVelocity = this.velocity.clone();
    quat = camera.quaternion.clone().inverse();
    newVelocity.applyQuaternion(quat);
    camera.translateX(newVelocity.x * dt);
    camera.translateY(newVelocity.y * dt);
    camera.translateZ(newVelocity.z * dt);

    if (camera.position.y <= 10 && this.velocity.y <= 0) {
        this.velocity.y = 0;
        camera.position.y = 10;
        this.canJump = true;
    }
});

user.move = function (velocity) {
    if (velocity.x === undefined) {
        this.velocity.x += velocity[0];
        //this.velocity.y += velocity[1];
        this.velocity.z += velocity[2];
    } else {
        // If 3D movement is disabled
        velocity.y = 0;
        this.velocity.add(velocity);
    }
};

user.setVelocity = function (velocity) {
    if (velocity.x === undefined) {
        this.velocity.x = velocity[0];
        this.velocity.y = velocity[1];
        this.velocity.z = velocity[2];
    } else {
        this.velocity.set(velocity);
    }
};

user.toggleGravity = function (enabled) {
    this.gravity = enabled;
};