"use strict";

function Scene(skyEmission, groundReflection, triangles, eyePosition) {
    skyEmission = clamp(skyEmission, 0, Infinity);
    groundReflection = mul(skyEmission, clamp(groundReflection, 0, 1));
    var emitters = filter(triangles, glows);
    var index = new SpatialIndex(eyePosition, triangles);
    return {
        intersect: function(rayOrigin, rayDirection, lastHit) {
            return index.intersection(rayOrigin, rayDirection, lastHit);
        },
        sampleEmitter: function(random) {
            if (emitters.length === 0) return null;
            return sampleArray(emitters, random);
        },
        countEmitters: function() {
            return emitters.length;
        },
        getDefaultEmission: function(backDirection) {
            return backDirection[1] < 0 ? skyEmission : groundReflection;
        },
    };
}

function glows(triangle) {
    return !isZero(triangle.emissivity) && 0 < triangle.getArea();
}

function filter(xs, ok) {
    var result = [];
    for (var i = 0; i < xs.length; ++i)
        if (ok(xs[i]))
            result.push(xs[i]);
    return result;
}

function sampleArray(xs, random) {
    return xs[Math.floor(random() * xs.length)];
}
