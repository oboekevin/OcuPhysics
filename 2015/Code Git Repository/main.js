'use strict';

var DEBUG = 1;
var gui = require('nw.gui'),
    win = gui.Window.get();

if (DEBUG) {
    win.showDevTools();
}

var argv = require('minimist')(gui.App.argv);
if (argv.width != undefined || argv.height != undefined) {
    window.innerWidth = argv.width || 1920;
    window.innerHeight = argv.height || 1080;
    win.resizeTo(window.innerWidth, window.innerHeight);
}
if (argv.x != undefined || argv.y != undefined) {
    win.moveTo(argv.x || 0, argv.y || 0);
}
if (argv.zoomout != undefined) {
    win.zoomLevel = -argv.zoomout;
}


// Transfer some useful globals into the node context for require(...)'d modules that need them
global.THREE = THREE;
global.Leap = Leap;
global.document = document;
global.Image = Image;

var keyboard = require('./keyboard.js'),
    renderer = require('./renderer.js'),
    menu = require('./menu.js'),
    viewcontrols = require('./viewcontrols.js'),
    user = require('./user.js'),
    gestures = require('./gestures.js'),
    objects = require('./objects.js'),
    loader = require('./loader.js'),
    debug = require('./debug.js'),
    tutorial = require('./tutorial.js'),
    shaders = require('./shaders.js');

debug.log(argv);

if (argv.forceoculus) {
    console.log('forcing oculus rift effect');
    renderer.forceOculusEffect = true;
}

if (argv.fullscreen) {
    win.enterFullscreen();
}

if (argv.skiptutorial) {
    console.log('skipping tutorial');
    tutorial.skip();
}

var fpsCounter;
if (argv.showfps) {
    fpsCounter = new Stats();
    fpsCounter.setMode(0); // 0: fps, 1: ms

    // align top-left
    fpsCounter.domElement.style.position = 'absolute';
    fpsCounter.domElement.style.left = '0px';
    fpsCounter.domElement.style.top = '50%';

    document.body.appendChild(fpsCounter.domElement);
}

keyboard.listen.on('down:f11', function () {
    win.toggleFullscreen();
});

var clock, scene;

function randColor() {
    return Math.floor(Math.random() * 0xffffff) | 0;
}

function createCube(pos, size) {
    size = size || 10;
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), renderer.makeDefaultMaterial(randColor()));
    return objects.makeObjectFromMesh(mesh, 'cube', pos);
}

function setup() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();

    gestures.initialize(scene, renderer.camera);
    debug.log('Gestures initialized', 'green');

    scene.add(renderer.camera);

    var floor = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), shaders.makeShaderMaterial('shaders/floor.vs', 'shaders/floor.fs'));
    floor.material.uniforms.squareSize = {
        type: 'f',
        value: 500.0
    };
    floor.material.side = THREE.DoubleSide;
    floor.rotateX(Math.PI / 2);
    scene.add(floor);

    // world coordinate system (thin dashed helping lines)
    var axisLines = [ new THREE.Geometry(), new THREE.Geometry(), new THREE.Geometry() ];
    axisLines[0].vertices.push(
        new THREE.Vector3( 1000,     0,     0),
        new THREE.Vector3(-1000,     0,     0)
    );
    axisLines[1].vertices.push(
        new THREE.Vector3(    0,  1000,     0),
        new THREE.Vector3(    0, -1000,     0)
    );
    axisLines[2].vertices.push(
        new THREE.Vector3(    0,     0,  1000),
        new THREE.Vector3(    0,     0, -1000)
    );
    axisLines.forEach(function(axis) {
        axis.computeLineDistances();
        scene.add(new THREE.Line(axis, new THREE.LineDashedMaterial({
            color: 0xcccccc,
            dashSize: 10,
            gapSize: 5
        })));
    });

    // spawn 10 cubes around origin
    for (var i = 0; i < 10; i++) {
        // closures + for loops = stupid
        (function (i) {
            var angle = Math.PI * 2 / 10 *  i;
            var pos = new THREE.Vector3(Math.cos(angle) * 50, 20, Math.sin(angle) * 50);
            createCube(pos).on('update', function (dt) {
                //this.mesh.rotation.z += ((i % 2) * 2 - 1) * dt;
            });
        })(i);
    }

    // .obj imports
    var teapot = loader.load('data/teapot.obj', renderer.makeDefaultMaterial(randColor()));
    teapot.on('object-loaded', function () {
        this.mesh.scale.set(0.1, 0.1, 0.1);
        this.mesh.position.set(10, 8, 0);
        scene.add(this.mesh);
    });
    teapot.on('update', function (dt) {
        teapot.mesh.rotation.y += 2 * dt;
    });

    renderer.camera.position.y = 10;
    renderer.camera.position.z = 100;

    scene.add(new THREE.AmbientLight(0x111111));

    var light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(0, 100, 0);
    scene.add(light);

    update();
}

function update() {
    if (fpsCounter)
        fpsCounter.begin();

    objects.emitToAll('update', clock.getDelta());

    renderer.render(scene);

    if (fpsCounter)
        fpsCounter.end();

    requestAnimationFrame(update);
}

document.addEventListener('DOMContentLoaded', function() {
    setup();
});