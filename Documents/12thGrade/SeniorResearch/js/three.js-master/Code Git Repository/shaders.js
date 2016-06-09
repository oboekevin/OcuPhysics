'use strict';

var fs = require('fs');

exports.makeShaderMaterial = function (vertex, fragment) {
    return new THREE.ShaderMaterial({
        vertexShader: fs.readFileSync(vertex || 'shaders/default.vs'),
        fragmentShader: fs.readFileSync(fragment || 'shaders/default.fs'),
        uniforms: {
            'color': {
                'type': 'c',
                'value': new THREE.Color(0xdddddd)
            },
            'alpha': {
                'type': 'f',
                'value': 1.0
            }
        }
    });
};