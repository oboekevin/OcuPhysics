// File:src/core/Raycaster.js
/**
 * @author mrdoob / http://mrdoob.com/
 * @author bhouston / http://exocortex.com/
 * @author stephomi / http://stephaneginier.com/
 */

exports.Raycaster = function (origin, direction, near, far) {
    this.ray = new THREE.Ray(origin, direction);
    // direction is assumed to be normalized (for accurate distance calculations)
    this.near = near || 0;
    this.far = far || Infinity;
    this.params = {
        Sprite: {},
        Mesh: {},
        PointCloud: { threshold: 1 },
        LOD: {},
        Line: {}
    };
};

var descSort = function (a, b) {
    return a.distance - b.distance;
};

var intersectObject = function (object, raycaster, intersects, recursive) {
    object.raycast(raycaster, intersects);
    if (recursive === true) {
        var children = object.children;
        for (var i = 0, l = children.length; i < l; i++) {
            intersectObject(children[i], raycaster, intersects, true);
        }
    }
};

exports.Raycaster.prototype = {
    constructor: exports.Raycaster,
    precision: 0.0001,
    linePrecision: 1,
    set: function (origin, direction) {
        this.ray.set(origin, direction);
    },
    intersectObject: function (object, recursive) {
        var intersects = [];
        intersectObject(object, this, intersects, recursive);
        intersects.sort(descSort);
        return intersects;
    },
    intersectObjects: function (objects, recursive) {
        var intersects = [];
        // removed instanceof check here because it was incorrectly triggering
        for (var i = 0, l = objects.length; i < l; i++) {
            intersectObject(objects[i], this, intersects, recursive);
        }
        intersects.sort(descSort);
        return intersects;
    }
};
