'use strict';

var renderer = require('./renderer.js'),
    rendering2d = require('./rendering2d.js');

var createVideoElement = function() {
    var video = document.createElement('video');
    video.width = 400;
    video.height = 352;
    video.src = 'data/nyan.webm';
    video.loop = true;
    video.load();
    return video;
};

var videoObject = rendering2d.create2DSurface('video', 54, 36, 400, 352);
videoObject.on('init', function () {
    this.video = createVideoElement();
});
videoObject.on('render-init', function (ctx, _, scene) {
    this.mesh.position.set(0, 50, -10);
    scene.add(this.mesh);

    this.video.play();
});
videoObject.on('render-2d', function (ctx) {
    if (this.video.readyState == this.video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(this.video, 0, 0);
        this.updateTexture();
    }
});
