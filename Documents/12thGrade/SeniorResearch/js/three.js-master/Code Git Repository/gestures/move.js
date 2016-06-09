'use strict';

var gestures = require('../gestures.js'),
    debug = require('../debug.js'),
    user = require('../user.js'),
    gestureSelect = require('./select.js');

var GestureMove = function() {
    this.id = 'MOVE';
    this.type = gestures.gestureTypes.secondary;
    this.required = gestureSelect;

    this.prevPosition = undefined;

    this.prevFinger = undefined;
    this.normal = undefined;
    this.object = undefined;
    this.unlocked = false;
    this.MIN_THRESHOLD = .1;    // Minimum distance before move registers

    this.MAX_THRESHOLD = 200;    // Maximum distance in one frame

    var self = this;

    var moveObject = function(hand) {
        var position = hand.data('riggedHand.mesh').fingers[1].getWorldPosition(),  // mcp position
            finger = new THREE.Ray(position, hand.data('riggedHand.mesh').fingers[1].tip.getWorldPosition().sub(position).normalize()),
            plane = new THREE.Plane();
        plane.setFromNormalAndCoplanarPoint(self.normal, self.object.mesh.position);
        // Lock hand movement to orthogonal vector to plane
        self.object.mesh.position.add(position.clone().sub(self.prevPosition).projectOnVector(plane.projectPoint(position).sub(position)).multiplyScalar(5));
        // Lock finger movement to plane
        var intersect = finger.intersectPlane(plane);
        if (intersect) {
            var prevIntersect = self.prevFinger.intersectPlane(plane);
            if (prevIntersect) {
                intersect.sub(prevIntersect);
                self.object.mesh.position.add(intersect);
                self.prevFinger.copy(finger);
            }
        }/*
        if (deltaPosition.length() > self.MAX_THRESHOLD) {
            debug.log('Skipping frame due to large movement');
        }*/
        self.prevPosition.copy(position);
        //console.log(self.object.mesh.position.x + ',' + self.object.mesh.position.y + ',' + self.object.mesh.position.z);
        //console.log(self.object.mesh);
        return intersect;
    };

    this.canActivate = function(secondaryHand) {
        return secondaryHand.sphereRadius < gestures.settings.triggerSphereRadius && !secondaryHand.indexFinger.extended;
    };

    this.activate = function(primaryHand, secondaryHand, object) {
        this.prevPosition = new THREE.Vector3();
        var tip = primaryHand.data('riggedHand.mesh').fingers[1].tip.getWorldPosition(),
            mcp = primaryHand.data('riggedHand.mesh').fingers[1].getWorldPosition();
        this.prevPosition.copy(tip);
        // Select axis closest to orthogonal
        tip.sub(mcp).normalize();
        this.normal = new THREE.Vector3();
        var rotation = new THREE.Matrix4();
        rotation.extractRotation(object.mesh.matrix);
        for (var i = 0, max = 0, test = new THREE.Vector3(); i < 3; i++) {
            test.set(0, 0, 0);
            test.setComponent(i, 1);
            test.applyMatrix4(rotation);
            if (Math.abs(test.dot(tip)) > max) {
                max = Math.abs(test.dot(tip));
                this.normal.copy(test);
                //debug.log(i);
            }
            //debug.log(Math.abs(test.dot(tip)));
        }
        this.prevFinger = new THREE.Ray(mcp, tip.normalize());
        this.unlocked = false;
        this.object = object;
        this.required.lock = true;
    };

    this.update = function(primaryHand, secondaryHand) {
        if (secondaryHand.sphereRadius > gestures.settings.triggerSphereRadius || secondaryHand.indexFinger.extended) {
            return false;
        }
        return moveObject(primaryHand);
    };

    this.deactivate = function() {
        this.prevPosition = undefined;
        this.prevFinger = undefined;
        this.object = undefined;
        this.normal = undefined;
        this.required.lock = false;
    }
};

exports = module.exports = new GestureMove();