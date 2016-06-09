'use strict';

var gestures = require('./gestures.js'),
    objects = require('./objects.js'),
    rendering2d = require('./rendering2d.js');

var DEFAULT_TIMEOUT = 3,
    TIMEOUT_AFTER_STEP = 5;

var tutorialObj = rendering2d.create2DSurface(
    'tutorial',
    2.0,
    0.5,
    2000,
    500
);

tutorialObj.setCurrentStep = function (index) {
    if (index < 0 || index >= tutorialSteps.length) {
        this.currentStepIndex = -1;
        this.currentStep = undefined;
        this.currentStepDone = true;
        return;
    }
    this.currentStepIndex = index;
    this.currentStep = tutorialSteps[index];
    this.currentStepDone = false;
    this.waitTime = this.currentStep.timeout || DEFAULT_TIMEOUT;
};

exports.isRunning = function () {
    return tutorialObj.currentStepIndex !== -1;
};

exports.skip = function () {
    tutorialObj.setCurrentStep(-1);
};

tutorialObj.on('init', function () {
    if (this.currentStepIndex === undefined) { // don't override if tutorial has already been skipped
        this.setCurrentStep(0);
    }
}).on('render-init', function (_, camera, scene) {
    console.log(this);

    this.camera = camera;

    var canvasRes = rendering2d.createAlphaCanvasHelper(this.canvas);
    this.ctx = canvasRes.ctx;
    this.alphaCanvas = canvasRes.alphaMap;
    this.mesh.material.alphaMap = rendering2d.genCanvasTexture(this.alphaCanvas);

    this.mesh.position.set(0, -0.1, -1);
    this.meshAdded = false;
}).on('update', function (delta) {
    var satisfied = this.currentStepDone || [].concat(this.currentStep.criteria).every(function (c) {
            return c === undefined ? true : c();
        });

    if (satisfied && !this.currentStepDone) { // just became satisfied this frame
        this.currentStepDone = true;
        this.waitTime = Math.max(TIMEOUT_AFTER_STEP, this.waitTime);
    } else { // either counting down pre-completion timeout or post-completion timeout
        this.waitTime = Math.max(0, this.waitTime - delta);

        if (satisfied && this.waitTime <= 0) { // completely done
            this.setCurrentStep(this.currentStepIndex += 1);
        }
    }
}).on('render-2d', function (ctx) {
    if (this.currentStepIndex === -1) {
        if (this.meshAdded) {
            this.camera.remove(this.mesh);
            this.meshAdded = false;
        }
        return;
    } else if (!this.meshAdded) {
        this.camera.add(this.mesh);
        this.meshAdded = true;
    }

    ctx.fillStyle = 'rgba(60, 60, 60, 0.2)';
    ctx.fillRect(0, 0, 2000, 2000);

    var lines = [ this.currentStep.message ];
    while (true) {
        var line = lines[lines.length - 1],
            metrics = ctx.measureText(line);
        if (metrics.width <= this.canvas.width - 10) {
            break;
        }
        var brokenLine = '',
            words = line.split(' ');
        for (var i = 0; i < words.length; i++) {
            var newLine = (brokenLine + ' ' + words[i]).trim(),
                newMetrics = ctx.measureText(newLine);
            if (newMetrics.width > this.canvas.width - 10) { // if this is just firing, then without this word must be ok
                lines.pop();
                lines.push(brokenLine);
                lines.push(words.splice(i).join(' '));
                break;
            } else {
                brokenLine = newLine;
            }
        }
    }

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.font = 'Bold 72px Helvetica';

    var y = 72;
    for (var i = 0; i < lines.length; i++) {
        var msg = lines[i],
            x = 1000 - ctx.measureText(msg).width / 2;
        ctx.fillText(lines[i], x, y);
        y += 72 + 5;
    }

    if (this.currentStepDone) {
        // draw checkmark
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.beginPath();
        var r = 100;
        ctx.arc(this.canvas.width / 2, y + 5 + r, r, 0, 2 * Math.PI, false);
        ctx.fill();

        ctx.strokeStyle = 'rgb(255, 255, 255)';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2 - 64.800, y + 5 + r + 14.174);
        ctx.lineTo(this.canvas.width / 2 - 28.350, y + 5 + r + 56.700);
        ctx.lineTo(this.canvas.width / 2 + 60.750, y + 5 + r - 34.425);
        ctx.stroke();
    }

    this.updateTexture();
    this.mesh.material.alphaMap.needsUpdate = true;
});

var needsGesture = function (gestureId) {
    var gestureFired = false;
    gestures.listen.once('activate:' + gestureId, function () {
        gestureFired = true;
    });
    return function () {
        return gestureFired;
    };
};

var needsHandsNumber = function (handsNumber) {
    var found = false,
        listener = function (n) {
            if (n >= handsNumber) {
                found = true;
                gestures.listen.removeListener('handsnumber', listener);
            }
        };
    gestures.listen.on('handsnumber', listener);
    return function () {
        return found;
    }
};

var needsObjectsWithTag = function (tag) {
    return function () {
        return objects.findByTag(tag).length > 0;
    };
};

var tutorialSteps = [
    { message: 'Welcome to our electromagnetism modelling software!' },
    {
        message: 'To start, move your hands over the Leap sensor until you see them onscreen.',
        criteria: needsHandsNumber(2)
    },
    {
        message: 'Adjust the Leap sensor until your hands are in their resting position and near the bottom of the screen.',
        timeout: 5
    },
    {
        message: 'Extend the right hand index finger until you see a red line coming from its end.',
        criteria: needsGesture('SELECT')
    },
    {
        message: 'Point your finger at a point charge; it will light up when properly selected.',
        criteria: needsObjectsWithTag('selected')
    },
    {
        message: 'You have just learned your first gesture, the select gesture!',
        timeout: 5
    },
    {
        message: 'Now, select the object and make a fist with your left hand. By moving your fist and/or right index finger, you should be able to move the point charge and watch the electric field update as it moves.',
        criteria: needsGesture('MOVE')
    },
    {
        message: 'This is your second gesture, the move gesture!',
        timeout: 5
    },
    {
        message: 'You can release your fist to return to the select gesture or unextend your index finger to cancel both gestures.',
        timeout: 5
    },
    {
        message: 'To go through the tutorial again, make two fists with your hands.',
        timeout: 5
    },    
    {
        message: '',
        criteria: function() {/*effort*/}
    }
    /*,
    {
        message: 'Onto the next gesture. If you cancelled the select before, re-select an object.',
        criteria: needsObjectsWithTag('selected')
    },
    {
        message: 'Extend the index finger on your left hand without deselecting the object. \nYou can now scale the selected object by moving your index fingers about.',
        criteria: needsGesture('SCALE')
    },
    {
        message: 'Great job!',
        timeout: 3
    },
    {
        message: 'To open the menu, extend the index finger on your left hand without your right hand index finger.',
        criteria: needsGesture('MENU')
    },
    {
        message: 'You can select different menu options by moving your finger in a circle around the center of the screen.',
        criteria: function ()
    }
    */
];
