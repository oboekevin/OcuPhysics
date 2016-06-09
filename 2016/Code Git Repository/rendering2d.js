'use strict';

var csscolor = require('csscolorparser'),
    objects = require('./objects.js'),
    debug = require('./debug.js');

var makeCanvas = exports.makeCanvas = function(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

var genCanvasTexture = exports.genCanvasTexture = function (canvas) {
    var t = new THREE.Texture(canvas);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    return t;
};

exports.create2DSurface = function (name, width, height, canvasWidth, canvasHeight) {
    var object = new objects.Entity(name, ['renderable']);
    object.updateTexture = function() {
        this.texture.needsUpdate = true;
    };
    object.on('init', function () {
        this.canvas = makeCanvas(canvasWidth, canvasHeight);
        this.ctx = this.canvas.getContext('2d');
        this.texture = genCanvasTexture(this.canvas);

        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({
            map: this.texture,
            overdraw: true,
            side: THREE.DoubleSide,
            transparent: true
        }));
    });
    object.once('render', function (camera, scene) {
        this.emit('render-init', this.ctx, camera, scene);
    });
    object.on('render', function (camera, scene) {
        this.emit('render-2d', this.ctx, camera, scene);
    });
    return object;
};

var FakeCtx = function (canvasA, canvasB) {
    this.ctxA = canvasA.getContext('2d');
    this.ctxB = canvasB.getContext('2d');

    this.colorStore = {};
};

var strictEqualityExceptions = [
    'measureText'
];

var assignContextProperty = function (property, propertyType) {
    if (propertyType === 'function') {
        FakeCtx.prototype[property] = function () {
            var argArray = Array.prototype.slice.call(arguments),
                ra = this.ctxA[property].apply(this.ctxA, argArray),
                rb = this.ctxB[property].apply(this.ctxB, argArray);
            if (ra !== rb && strictEqualityExceptions.indexOf(property) === -1) {
                var argString = argArray.join(', ');
                debug.warn('Console proxy got two different results for calling ' + property);
                debug.warn('    Canvas A: ' + property + '(' + argString + ') = ' + ra);
                debug.warn('    Canvas B: ' + property + '(' + argString + ') = ' + rb);
            }
            return ra;
        };
    } else {
        if (property != 'fillStyle' && property != 'strokeStyle') {
            FakeCtx.prototype.__defineGetter__(property, function () {
                return this.ctxA[property];
            });
            FakeCtx.prototype.__defineSetter__(property, function (value) {
                this.ctxA[property] = this.ctxB[property] = value;
            });
        } else {
            FakeCtx.prototype.__defineGetter__(property, function () {
                return this.colorStore[property] || this.ctxA[property];
            });
            FakeCtx.prototype.__defineSetter__(property, function (value) {
                var color = csscolor.parseCSSColor(value);
                if (color === null || color.length < 3) {
                    throw new Error('Invalid color ' + value + ': ' + color);
                } else {
                    this.colorStore[property] = value;
                    if (color.length === 3 || color[3] === 1) { // no alpha
                        this.ctxA[property] = value;
                        this.ctxB[property] = 'rgb(255, 255, 255)'; // white = full alpha
                    } else {
                        this.ctxA[property] = 'rgb(' + color.slice(0, 3).join(', ') + ')';
                        var alphaValue = Math.round(255 * color[3]);
                        this.ctxB[property] = 'rgb(' + [ alphaValue, alphaValue, alphaValue ].join(', ') + ')';
                        // console.log('got color with alpha ' + value + ', splitting to ' + 'rgb(' + color.slice(0, 3).join(', ') + ');' + ' and ' + 'rgb(' + [ alphaValue, alphaValue, alphaValue ].join(', ') + ');');
                    }
                }
            });
        }
    }
}

var _ctx = makeCanvas(0, 0).getContext('2d');
for (var property in _ctx) {
    assignContextProperty(property, typeof _ctx[property]);
}

exports.createAlphaCanvasHelper = function (canvas, transparentCanvas) {
    // So basically in THREE the alphaMap and map textures are totally seperate
    // so if you want to draw transparent stuff you need to draw on two seperate canvases
    // This papers that over a bit in a hacky way.
    transparentCanvas = transparentCanvas || makeCanvas(canvas.width, canvas.height);
    return {
        ctx: new FakeCtx(canvas, transparentCanvas),
        map: canvas,
        alphaMap: transparentCanvas
    };
};