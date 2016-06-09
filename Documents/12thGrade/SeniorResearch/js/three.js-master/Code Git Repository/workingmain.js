'use strict';

var DEBUG = 1;
var charge_list = []; 
var copy_of_positions = [];
var new_positions = [];
var moved_charge;
var electric_field = [];
var theta = -2;
var phi = -1;
var camera_radius = 80;
var K = 1;
var selected_id;
var P = 5;
var big_x, big_y, big_z;
var the_origin;
var sol;
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
tutorial.skip();
/*
if (argv.skiptutorial) {
    console.log('skipping tutorial');
    tutorial.skip();
}
*/
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

function PointCharge(s, x0, y0, z0, r, q) {
        this.scene = s;
        this.vec = new THREE.Vector3(x0, y0, z0);
        this.radius = r;
        this.charge = q;
        // make_axes(scene, r * 2, x0, y0, z0);
        this.hex = (q < 0) ? 0x0000ff : 0xff0000;
        this.sphere = make_sphere(scene, r, x0, y0, z0, this.hex);
        this.contribution = null;
        this.contribute_to_electric_field = function(field) { // where field is a list of position vectors
            if (this.contribution == null) {
                this.contribution = new Array(field.length);
                //console.log("Butts!");
                field.forEach(function(F, index){
                    var r = new THREE.Vector3();
                    r.subVectors(F.pos, this.vec);
                    var mag_r = r.length();
                    var e = K * this.charge / mag_r / mag_r / mag_r;
                    r.multiplyScalar(e);
                    this.contribution[index] = r;
                    F.field.add(r);
                }, this);
            } else {
                field.forEach(function(F, index) {
                    F.field.add(this.contribution[index]);
                }, this)
            }
        }
    }

    
    function make_sphere(s, r, x0, y0, z0, hex) {
        var s_geometry = new THREE.SphereGeometry( r, 32, 32 );     
        //var s_material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
        var s_material = new THREE.MeshLambertMaterial( {color: hex} );
        var sphere = new THREE.Mesh( s_geometry, s_material );
        sphere.position.set(x0, y0, z0);
        //s.add( sphere );
        var pos = new THREE.Vector3(x0, y0, z0);
        return objects.makeObjectFromMesh(sphere, 'sphere', pos);
    }
    
    function make_arrow(s, origin, dir, magnitude) {
        // center of arrow on origin
        var length = magnitude * 17;
        var hex = 0xffffff;
        var arrow_length = 2;
        var halfway_back = new THREE.Vector3();
        halfway_back.copy(dir);
        halfway_back.multiplyScalar(arrow_length / 2);
        halfway_back.negate();
         var new_orig = new THREE.Vector3();
         new_orig.subVectors(origin, halfway_back);
        var arrowHelper = new THREE.ArrowHelper( dir, new_orig, arrow_length, hex, arrow_length / 2, magnitude * 5);
        // arrowHelper.cone
        // arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex, length / 3, length / 3);
        s.add( arrowHelper );
        return arrowHelper;
    }
    
    function findPositions(charges) {
        var array = [];
        for(var j = 0; j < charges.length; j++) {
            var v = charges[j].sphere.mesh;
            array.push([v.position.x, v.position.y, v.position.z]);
            charges[j].vec.copy(v.position);
        }
        return array;
    }
    
    function theSame(oldPos, newPos) {
        var x = -1;
        for(var j = 0; j < oldPos.length; j+= 1) {
            var position = oldPos[j];
            var position2 = newPos[j];
            for(var k = 0; k < 3; k += 1) {
                if(position[k] != position2[k]) {
                    //console.log("it worked");
                    x = j;
                }
            }
        }
        return x;
    }
    
    function make_electric_field(s, charges) {
        var field = new Array();
        for (var x = -60; x <= 60; x += 17.5) {
            for (var y = -60; y <= 60; y +=17.5) {
                for (var z = -15; z <= 15; z += 7.5) {
                    field.push({pos: new THREE.Vector3(x, y, z), field: new THREE.Vector3(0, 0, 0)});
                    // position vector and field strength vector
                }
            }
        }
        charges.forEach(function(charge) {
            charge.contribute_to_electric_field(field);
        });
        field.forEach(function(F) {
            var mag = F.field.length();
            var dir = F.field.normalize();
            F.arrow = make_arrow(s, F.pos, dir, mag);
        });
        return field;
    }

    function update_field(s, charges, field) {

        field.forEach(function(F) {
            F.field = new THREE.Vector3(0, 0, 0);
            scene.remove(F.arrow);
        });
        
        charges.forEach(function(charge) {
            charge.contribute_to_electric_field(field);
        });
        
        field.forEach(function(F) {
            var mag = F.field.length();
            var dir = F.field.normalize();
            F.arrow = make_arrow(s, F.pos, dir, mag);
        });
        
    }

function setup() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();

    gestures.initialize(scene, renderer.camera);
    debug.log('Gestures initialized', 'green');

    scene.add(renderer.camera);

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
    
    charge_list.push(new PointCharge(scene, -10, -10, 0, 2, -10));
    charge_list.push(new PointCharge(scene, 10, 10, 0, 2, 10));
    //charge_list.push(new PointCharge(scene, -10, -10, 20, 2, 10));
    charge_list.push(new PointCharge(scene, -10, -10, -20, 2, 10));
    charge_list.push(new PointCharge(scene, -20, -20, 3, 2, -5));

    copy_of_positions = findPositions(charge_list);
    
    renderer.camera.position.x = 25
    renderer.camera.position.y = -25;
    renderer.camera.position.z = 20;

    scene.add(new THREE.AmbientLight(0x111111));

    var light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(0, 100, 0);
    scene.add(light);
    electric_field = make_electric_field(scene, charge_list);
    var light = new THREE.PointLight( 0xffffff, 1, 400 );
        light.position.set( 10, 10, 80 );
        scene.add( light );

    update();
}

function update() {
    if (fpsCounter)
        fpsCounter.begin();

    objects.emitToAll('update', clock.getDelta());
    new_positions = findPositions(charge_list);
    moved_charge = theSame(copy_of_positions, new_positions);
    copy_of_positions = findPositions(charge_list);
    
    if(moved_charge != -1)
    {
       charge_list[moved_charge].contribution = null;
       update_field(scene, charge_list, electric_field);
    }
    renderer.render(scene);

    if (fpsCounter)
        fpsCounter.end();

    requestAnimationFrame(update);
}

document.addEventListener('DOMContentLoaded', function() {
    setup();
});