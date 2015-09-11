'use strict';

var objects = require('../objects.js'),
    gestures = require('../gestures.js'),
    renderer = require('../renderer.js'),
    rc = require('../raycaster.js'),
    debug = require('../debug.js');

var raycast = function(tip, end) {
    var raycaster = new rc.Raycaster(tip, end),
        grabbables = objects.findByTag('selectable'),
        grabbableMeshes = grabbables.map(function (grabbable) {
            return grabbable.mesh;
        });
    grabbables.forEach(function (grabbable) {
        grabbableMeshes.push(grabbable.mesh);
    });
    var intersects = raycaster.intersectObjects(grabbableMeshes);
    if (intersects.length) {
        var object = intersects[0].object.userData.parent; // closest
        if (object) {
            var prevSelect = objects.findByTag('selected');
            if (prevSelect[0] != object) {
                if (prevSelect.length) {
                    prevSelect[0].emit('deselect');
                }
                object.emit('select');
            }
        }
    }
};

var GestureSelect = function() {
    this.id = 'SELECT';
    this.type = gestures.gestureTypes.onHand;

    this.lock = false;

    var self = this;

    this.laser = new objects.Entity('laser', ['renderable']);
    this.laser.once('render', function () {
        var line = new THREE.Geometry();
        line.vertices.push(
            new THREE.Vector3(),
            new THREE.Vector3()
        );
        self.line = line;
        line.computeLineDistances();
        self.mesh = new THREE.Line(line, new THREE.LineBasicMaterial({
            color: 0xff0000
        }));
    });

    this.canActivate = function(hand) {
        return hand.type == gestures.settings.handedness && hand.sphereRadius < gestures.settings.triggerSphereRadius && hand.indexFinger.extended;
    };

    this.activate = function() {
        renderer.scene.add(this.mesh);
    };

    this.canActivateSecondary = function (secondaryGesture, secondaryHand, primaryHand) {
        return objects.findByTag('selected').length > 0 && secondaryGesture.canActivate(secondaryHand, primaryHand);
    };

    this.activateSecondary = function (secondaryGesture, hand, otherHand) {
        secondaryGesture.activate(hand, otherHand, objects.findByTag('selected')[0]);
    };

    this.update = function(hand) {
        var tip = hand.data('riggedHand.mesh').fingers[1].tip.getWorldPosition(),
            end = tip.clone().sub(hand.data('riggedHand.mesh').fingers[1].pip.getWorldPosition());
        end.normalize();
        if (!this.lock) {
            raycast(tip, end);
        }
        end.multiplyScalar(2000);
        this.mesh.geometry.vertices[0].copy(tip);
        this.mesh.geometry.vertices[1].copy(end);
        this.mesh.geometry.verticesNeedUpdate = true;
        // Set this because the mesh is not a child of the camera
        this.mesh.frustumCulled = false;

        return hand.sphereRadius < gestures.settings.triggerSphereRadius && hand.indexFinger.extended;
    };

    this.deactivate = function() {
        renderer.scene.remove(this.mesh);
        // deselect objects here for now
        var prevSelect = objects.findByTag('selected');
        if (prevSelect.length) {
            prevSelect[0].emit('deselect');
        }
        gestures.listen.emit('select:off');
    };
}

exports = module.exports = new GestureSelect();