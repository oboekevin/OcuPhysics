'use strict';

var objects = require('./objects.js'),
    oculus = require('./oculus.js');

var menuAlphaCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // probably should use orthographic camera here, but meh effort
menuAlphaCamera.position.z = 1;

var makeMenuAlphaTexture = function(scene, bgColor) {
    var menuAlphaRT = new THREE.WebGLRenderTarget(512, 512, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
    var clearColor = renderer.getClearColor();
    renderer.setClearColor(bgColor, 1);
    renderer.render(scene, menuAlphaCamera, menuAlphaRT);
    renderer.setClearColor(clearColor);
    return menuAlphaRT;
};

var highlightSelectable = function(objects) {
    //  var highlightColor = 0xFFFF99;
    //  for each object in array of objects passed along from GesturesSelectable
    //  object.material.color.setHex(highlightColor);
};

exports.makeDefaultMaterial = function (color, ambientColor, specular, shininess, shading) {
    var color = color || 0xdddddd;
    return new THREE.MeshPhongMaterial({
        color: color,
        ambient: ambientColor || Math.floor(color * 0.25) | 0,
        specular: specular || 0x005500,
        shininess: shininess || 10,
        shading: shading || THREE.SmoothShading
    });
};

var camera = exports.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 1);
document.body.appendChild(renderer.domElement);

var oculusRiftEffect = new THREE.OculusRiftEffect(renderer);
oculusRiftEffect.setSize(window.innerWidth, window.innerHeight);
oculusRiftEffect.separation = 20;
oculusRiftEffect.distortion = 0.1;
oculusRiftEffect.fov = 110;

exports.forceOculusEffect = false;

exports.render = function(scene) {
    exports.scene = scene;

    objects.emitToTags('renderable', 'render', camera, scene);
    if (oculus.hmdAttached || exports.forceOculusEffect) {
    	oculusRiftEffect.render(scene, camera);
    } else {
    	renderer.render(scene, camera);
    }
};