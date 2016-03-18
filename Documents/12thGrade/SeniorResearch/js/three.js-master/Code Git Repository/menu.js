'use strict';

var keyboard = require('./keyboard.js'),
    rendering2d = require('./rendering2d.js'),
    renderer = require('./renderer.js'),
    gestures = require('./gestures.js'),
    objects = require('./objects.js'),
    debug = require('./debug.js'),
    tutorial = require('./tutorial.js');

var keymap = exports.keymap = {
    toggle: 'kJ',
    execute: 'kP',
    circle: [
        'kK',
        'kM',
        'kN',
        'kH',
        'kU',
        'kI'
    ]
};

function loadImage(path) {
    var i = new Image;
    i.src = path;
    return i;
}

function makeMenuActions () {
    return [
        {
            label: 'Create Object...',
            icon: loadImage('icons/createobject.png'),
            args: [
                {
                    label: 'Cube',
                    icon: loadImage('icons/cube.png'),
                    action: createCube,
                    args: [ 10 ]
                },
                {
                    label: 'Sphere',
                    icon: loadImage('icons/sphere.png'),
                    action: createSphere,
                    args: [ 10 ]
                },
                {
                    label: 'Cylinder',
                    icon: loadImage('icons/cylinder.png'),
                    action: createCylinder,
                    args: [ 10, 10 ]
                },
                {
                    label: 'Torus',
                    icon: loadImage('icons/torus.png'),
                    action: createTorus,
                    args: [ 10, 10 ]
                }
            ]
        }, {
            choose: function () {
                return +tutorial.isRunning();
            },
            choices: [
                {
                    label: 'Restart tutorial',
                    icon: loadImage('icons/restarttutorial.png'),
                    action: tutorial.setCurrentStep,
                    args: [ 0 ]
                }, {
                    label: 'Skip Tutorial',
                    icon: loadImage('icons/skiptutorial.png'),
                    action: tutorial.skip,
                    args: []
                }
            ]
        }, {
            label: 'Import Model...',
            icon: loadImage('icons/importmodel.png'),
            action: undefined,
            args: []
        }, {
            label: 'Toggle Axis Snapping',
            icon: loadImage('icons/togglesnapping.png'),
            action: undefined,
            args: []
        }, {
            label: 'Toggle Debug Menu',
            icon: loadImage('icons/toggledebug.png'),
            action: debug.toggle,
            args: []
        }, {
            label: 'Exit',
            icon: loadImage('icons/exit.png'),
            action: undefined,
            args: []
        }
    ];
}

var menuObject = rendering2d.create2DSurface('menu', 1.0, 1.0, 1024, 1024);
menuObject.on('init', function () {
    this.segments = 6;
    this.open = false;
    this.allActions = makeMenuActions();
    this.currentActions = this.allActions;
    this.getCurrentAction = function (i) {
        var a = this.currentActions[i === undefined ? this.segment : i];
        return a.choose ? a.choices[a.choose()] : a;
    };

    var self = this;
    keyboard.listen.on('down:' + keymap.toggle, function () {
        self.emit('toggle:' + ((self.open = !self.open) ? 'on' : 'off'));
    });
    keyboard.listen.on('down:' + keymap.execute, function () {
        if (self.segment !== undefined) {
            var a = self.actions[self.segment];
            if (a) {
                console.log('calling with ' + a);
                a.f.apply(self, a.f.args);
            }
        }
    });
    keymap.circle.forEach(function (binding, idx) {
        keyboard.listen.on('down:' + binding, function () {
            if (self.segment === idx) {
                self.segment = -1;
            } else {
                self.segment = idx;
            }
        });
    });
    gestures.listen.on('menu:on', function () {
        self.emit('toggle:on');
    });
    gestures.listen.on('menu:off', function() {
        self.emit('toggle:off');
    });
    var setSeg = function (angle) {
        self.segment = (angle === undefined) ? -1 : Math.floor(angle / (2 * Math.PI) * self.segments);
    };
    gestures.listen.on('menu:renderangle', setSeg);
    gestures.listen.on('menu:selectangle', function (angle) {
        setSeg(angle);
        var a = self.getCurrentAction();
        if (a.action) {
            a.action.apply(null, a.args);
        } else { // submenu
            self.currentActions = a.args;
        }
    });
}).on('render-init', function () {
    var canvases = rendering2d.createAlphaCanvasHelper(this.canvas);
    this.alphaTexture = this.mesh.material.alphaMap = rendering2d.genCanvasTexture(canvases.alphaMap);
    this.ctx = canvases.ctx;

    this.mesh.position.set(0, 0, -0.99);
}).on('toggle:on', function () {
    this.open = true;
    this.segment = -1;
    this.previousSegment = undefined;
    this.currentActions = this.allActions;
    renderer.camera.add(this.mesh);
}).on('toggle:off', function () {
    this.open = false;
    renderer.camera.remove(this.mesh);
}).on('render-2d', function (_) { // ignore ctx arg...
    var ctx = this.ctx; // ...and assign ctx to the proxy context
    /*
    if (this.open && this.segment !== this.previousSegment) {
        this.previousSegment = this.segment === -1 ? undefined : this.segment;

        var circleColor = 'rgba(0, 255, 255, 0.4)',
            segmentColor = 'rgba(0, 255, 255, 0.8)';

        if (this.segment === -1) {
            var circleAlpha = Math.sin(+new Date / 250) * 0.2 + 0.4;
            circleColor = 'rgba(0, 255, 255, ' + circleAlpha.toString().slice(0, 4) + ')';
        }

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        var angw = 2 * Math.PI / 6;
        for (var piece = 0; piece < 6; piece++) {
            this.ctx.fillStyle = piece == this.segment ? segmentColor : circleColor;
            ctx.beginPath();
            var angle = piece * angw - Math.PI;
            ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 512, angle, angle + angw, false);
            ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 300, angle + angw, angle, true);
            ctx.closePath();
            ctx.fill();

            if (piece < this.currentActions.length) {
                var iconAngle = angle + angw / 2,
                    iconDist = (512 + 300) / 2,
                    iconWidth = 64,
                    iconHeight = 64,
                    iconX = Math.cos(iconAngle) * iconDist - iconWidth / 2 + this.canvas.width / 2,
                    iconY = Math.sin(iconAngle) * iconDist - iconHeight / 2 + this.canvas.height / 2,
                    icon = this.getCurrentAction(piece).icon;
                if (icon !== undefined) {
                    //debug.log('icon undefined for ' + piece);
                    ctx.drawImage(icon, iconX, iconY);
                }
            }
        }
        
        this.updateTexture();
        this.alphaTexture.needsUpdate = true;
    }
    */
});

function createCube(size) {
    size = size || 10;
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), renderer.makeDefaultMaterial());
    return objects.makeObjectFromMesh(mesh, 'cube', new THREE.Vector3(0, 0, -20));
}

function createSphere(size) {
    size = size || 10;
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(size, size, size), renderer.makeDefaultMaterial());
    return objects.makeObjectFromMesh(mesh, 'sphere', new THREE.Vector3(0, 0, -20));
}

function createCylinder(radius, height) {
    radius = radius || 10;
    height = height || 20;
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height), renderer.makeDefaultMaterial());
    return objects.makeObjectFromMesh(mesh, 'cylinder', new THREE.Vector3(0, 0, -20));
}

function createTorus(radius, tube) {
    radius = radius || 10;
    tube   = tube   ||  5;
    var mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube), renderer.makeDefaultMaterial());
    return objects.makeObjectFromMesh(mesh, 'torus', new THREE.Vector3(0, 0, -20));
}