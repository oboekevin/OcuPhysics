'use strict';

var events = require('events'),
    util = require('util');

var tagsMap = exports.tagsMap = {};
var entities = exports.entities = [];

var id = 0;

var Entity = exports.Entity = function(name, tags, mesh) {
    this.name = name + '-' + (id++);
    this.tags = [ 'all' ].concat(tags || []);
    this.mesh = mesh;
    var self = this;
    this.tags.forEach(function (tag) {
        tagsMap[tag] = tagsMap[tag] || [];
        tagsMap[tag].push(self);
    });
    this.once('update', function () {
        this.emit('init');
    });
    entities.push(this);
};

util.inherits(Entity, events.EventEmitter);

Entity.prototype.addTags = function(tags) {
    var self = this;
    [].concat(tags).forEach(function (tag) {
        if (self.tags.indexOf(tag) === -1) {
            self.tags.push(tag);
            tagsMap[tag] = tagsMap[tag] || [];
            tagsMap[tag].push(self);
        }
    });
};

Entity.prototype.removeTags = function(tags) {
    var self = this;
    [].concat(tags).forEach(function (tag) {
        var idx = self.tags.indexOf(tag);
        if (idx >= 0) {
            self.tags.splice(idx, 1);
            tagsMap[tag].splice(tagsMap[tag].indexOf(self), 1);
        }
    });
};

exports.findByTag = function (tags) {
    var entities = [];
    [].concat(tags).forEach(function (tag) {
        if (tagsMap[tag]) {
            entities = entities.concat(tagsMap[tag]);
        }
    });
    return entities;
};

var emitToTags = exports.emitToTags = function(tags, event) {
    // allow single string or list
    var args = arguments;
    [].concat(tags).forEach(function (tag) {
        if (tagsMap[tag]) {
            tagsMap[tag].forEach(function (ent) {
                if (ent !== undefined) {
                    var emitArgs = Array.prototype.slice.call(args).slice(1);
                    ent.emit.apply(ent, emitArgs);
                }
            });
        }
    });
};

exports.emitToAll = function(event) {
    emitToTags.apply(null, ['all'].concat(Array.prototype.slice.call(arguments)));
};

exports.makeObjectFromMesh = function (mesh, name, pos) {
    var obj = new Entity('object.' + (name || 'unnamed'), ['renderable', 'selectable'], mesh);
    obj.on('init', function () {
        this.mesh = mesh;
        //console.log(mesh);
        if (pos !== undefined) {
            this.mesh.position.copy(pos);
        }
        this.mesh.userData.parent = this;
    });
    obj.once('render', function (_, scene) {
        scene.add(this.mesh);
    });
    obj.on('select', function() {
        this.mesh.material.emissive = new THREE.Color(this.mesh.material.color);
        this.addTags('selected');
    });
    obj.on('deselect', function() {
        this.mesh.material.emissive = new THREE.Color(0x000000);
        this.removeTags('selected');
    });
    return obj;
};