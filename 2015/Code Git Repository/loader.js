'use strict';

var fs = require('fs'),
    objects = require('./objects.js'),
    renderer = require('./renderer.js');

var loader = new THREE.OBJLoader();

function randColor() {
    return Math.floor(Math.random() * 0xffffff) | 0;
}

exports.load = function(filename, material) {
    material = material || new THREE.MeshBasicMaterial({
        color: randColor()
    });
    material.side = THREE.DoubleSide;
    var object = new objects.Entity(filename, ['renderable']);
    object.on('init', function () {
        this.mesh = loader.parse(fs.readFileSync(filename).toString());
        this.mesh.traverse(function(child) {
            if (child.geometry) {
                child.geometry.computeFaceNormals();
                child.geometry.computeVertexNormals();
            }
            if (typeof material == 'function') {
                child.material = material(this, child);
            } else {
                child.material = material;
            }
        });
        this.emit('object-loaded');
    });
    return object;
};