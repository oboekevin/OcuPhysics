'use strict';

var renderer = require('./renderer.js'),
    rendering2d = require('./rendering2d.js');

exports.debugConsoleVisible = true; //false;

exports.toggle = function () {
    return (exports.debugConsoleVisible = !exports.debugConsoleVisible);
};

var consoleWidth = 600,
    consoleHeight = 500;

var debugConsoleObject = rendering2d.create2DSurface(
    'debug-console',
    consoleWidth / 1000,
    consoleHeight / 1000,
    consoleWidth,
    consoleHeight
);

debugConsoleObject.messages = [];

debugConsoleObject.on('init', function () {
    this.fontSize = 16;
    this.maxMessages = 0 | Math.floor(consoleHeight / this.fontSize) - 1;
    this.count = 0;
    this.dirty = true;
    exports.log('Initialized debug console');
});

debugConsoleObject.on('render-init', function (ctx, camera, scene) {
    this.mesh.position.set(0, -0.35, -1);
    this.currentlyVisible = exports.debugConsoleVisible;
    if (exports.debugConsoleVisible) {
        camera.add(this.mesh);
    }
    ctx.font = 'Bold ' + this.fontSize + 'px monospace';
});

debugConsoleObject.on('render-2d', function (ctx) {
    if (exports.debugConsoleVisible != this.currentlyVisible) {
        if (exports.debugConsoleVisible) {
            renderer.camera.add(this.mesh);
        } else {
            renderer.camera.remove(this.mesh);
        }
        this.currentlyVisible = exports.debugConsoleVisible;
    }
    if (!exports.debugConsoleVisible || !this.dirty)
        return;
    var self = this;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.clearRect(0, 0, consoleWidth, consoleHeight);
    ctx.rect(0, 0, consoleWidth, consoleHeight);
    ctx.fill();
    ctx.stroke();
    this.messages.forEach(function (msg, key) {
        ctx.fillStyle = msg.color;
        ctx.fillText(msg.text, 5, (1 + key) * self.fontSize);
    });
    this.updateTexture();
    this.dirty = false;
});

var print = exports.print = function (msg, color) {
	color = color || 'rgba(255, 255, 255, 1.0)';
	if (typeof msg == 'object') {
		msg = JSON.stringify(msg);
	} else if (msg == undefined) {
		msg = 'undefined';
	}
	msg.toString().split('\n').forEach(function (line) {
		debugConsoleObject.messages.push({ text: line, color: color });
	});
	if (debugConsoleObject.messages.length > debugConsoleObject.maxMessages) {
		debugConsoleObject.messages.splice(0, debugConsoleObject.messages.length - debugConsoleObject.maxMessages);
	}
    debugConsoleObject.dirty = true;
};

exports.log = function (msg, color) {
    print(msg, color);
	console.log(msg);
};

exports.warn = function (msg) {
    print(msg, 'color: yellow');
	console.warn(msg);
};

exports.error = function (msg, shouldThrow) {
    var error = new Error(msg);
    print(msg, 'color: red');
	print(error.stack, 'color: red');
	if (shouldThrow || shouldThrow == undefined) {
		throw error;
	} else {
		console.error(msg);
		console.error(error.stack);
	}
};