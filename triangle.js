"use strict";

var TOLERANCE = 1/1024;
var EPSILON = 1/1048576;

// TODO: inherit from a prototype instead of making a JSON object,
// for efficiency (?)

function Triangle(v0, v1, v2, reflectivity, emissivity) {
    reflectivity = clamp(reflectivity, 0, 1);
    emissivity = clamp(emissivity, 0, Infinity);
    var edge0 = sub(v1, v0);
    var edge1 = sub(v2, v1);
    var edge2 = sub(v2, v0);
    var tangent = normalize(edge0);
    return {
        getBounds: function() {
            // TODO: for efficiency (?) use the Minilight algorithm
            var bound = [Math.min(v0[0], v1[0], v2[0]),
                         Math.min(v0[1], v1[1], v2[1]),
                         Math.min(v0[2], v1[2], v2[2]),
                         Math.max(v0[0], v1[0], v2[0]),
                         Math.max(v0[1], v1[1], v2[1]),
                         Math.max(v0[2], v1[2], v2[2])]
            for (var j = 0; j < 3; ++j) {
                bound[j]   -= TOLERANCE * (1 + Math.abs(bound[j]));
                bound[j+3] += TOLERANCE * (1 + Math.abs(bound[j+3]));
            }
            // TODO: cleaner to use a pair of vectors?
            return bound;
        },
        // Return a positive number d such that rayOrigin + d * rayDirection
        // lies within this triangle, if possible, else null.
        intersect: function(rayOrigin, rayDirection) {
            // NB This returns a number or null; the original returns a boolean
            //  along with an output parameter.
            var edge1 = sub(v1, v0); // XXX redundant
            var pvec = cross(rayDirection, edge2);
            var det = dot(edge1, pvec);
            if (-EPSILON < det && det < EPSILON)
                return null;
            var invDet = 1 / det;
            var tvec = sub(rayOrigin, v0);
            var u = dot(tvec, pvec) * invDet;
            if (u < 0 || 1 < u)
                return null;
            var qvec = cross(tvec, edge1);
            var v = dot(rayDirection, qvec) * invDet;
            if (v < 0 || 1 < u + v)
                return null;
            var hitDistance = dot(edge2, qvec) * invDet;
            return 0 <= hitDistance ? hitDistance : null;
        },
        samplePoint: function(random) {
            var sqr1 = Math.sqrt(random());
            var r2 = random();
            return add(scale(1 - sqr1, edge0),
                       add(scale((1 - r2) * sqr1, edge2),
                           v0));
        },
        getNormal: function() {
            return normalize(cross(tangent, edge1));
        },
        getTangent: function()  {
            return tangent;
        },
        getArea: function() {
            return 0.5 * norm(cross(edge0, edge1));
        },
        getReflectivity: function() {
            return reflectivity;
        },
        getEmissivity: function() {
            return emissivity;
        },
    };
}

// Tests from Clojure port

// load('vector3.js')

// Triangle in xy-plane, reflect 1/2, emit 1
var xytriangle = Triangle([0,0,0], [1,0,0], [0,1,0], [1/2,1/2,1/2], [1,1,1])

// Same in yz plane
/// var y2ztriangle = Triangle([0,0,0], [0,2,0], [0,0,1], [1/2,1/2,1/2], [1,1,1])

// Parallel to zx plane
/// var zxtriangle = Triangle([-10,5,-10], [-9,5,-10], [-10,5,-9], [1/2,1/2,1/2], [1,1,1])

/// xytriangle.getTangent()
//. 1,0,0
/// y2ztriangle.getTangent()
//. 0,1,0

/// xytriangle.getNormal()
//. 0,0,1
/// y2ztriangle.getNormal()  // XXX different in Clojure -- don't bother to normalize?
//. 1,0,0

/// xytriangle.getArea()
//. 0.5
/// y2ztriangle.getArea()
//. 1

/// y2ztriangle.getBounds()
//. -0.0009765625,-0.0009765625,-0.0009765625,0.0009765625,2.0029296875,1.001953125
/// [TOLERANCE, 2+3*TOLERANCE, 1+2*TOLERANCE]
//. 0.0009765625,2.0029296875,1.001953125

/// xytriangle.intersect([0,0,1], [0,0,-1])
//. 1
/// xytriangle.intersect([0,0,2], [0,0,-1])
//. 2
/// xytriangle.intersect([.9,0,1], [0,0,-1])
//. 1
/// xytriangle.intersect([.1,.1,-1], [0,0,1])
//. 1

/// xytriangle.intersect([0,0,1], [0,0,1])   // Dir. is opposite
//. null
/// xytriangle.intersect([0,0,1.1], [1,0,0]) // Dir. is parallel
//. null
/// xytriangle.intersect([0,0,2], [0,1,-1])  // Goes wide
//. null

// (Just for testing.)
function checkRandomRay(t) {
    var rd = t.getNormal();
    return t.intersect(sub(t.samplePoint(Math.random), rd), rd);
}

/// checkRandomRay(xytriangle)
//. 1
/// checkRandomRay(zxtriangle)
//. 1
