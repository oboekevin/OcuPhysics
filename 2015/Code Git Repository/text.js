'use strict';

var renderer = require('./renderer.js');

var createTextCanvas = function() {
    var canvas1 = document.createElement('canvas');
    
    // canvas contents will be used for a texture
    var texture1 = new THREE.Texture(canvas1);
    texture1.needsUpdate = true;
      
    var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
    material1.transparent = true;

    return [canvas1, texture1, material1];
};

var elems = createTextCanvas(),
    canvas = elems[0],
    texture = elems[1],
    material = elems[2],
    context1 = canvas.getContext('2d');
context1.font = "Bold 40px Arial";
context1.fillStyle = "rgba(255,0,0,0.95)";
context1.fillText('console log goes here', 0, 50);

var mesh1 = new THREE.Mesh(
        new THREE.PlaneGeometry(canvas1.width, canvas1.height),
        elems[2]
      );
mesh1.position.set(0,50,-10);

exports.initialize = function(scene) {
    scene.add( mesh1 );
};