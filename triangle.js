"use strict";

var TOLERANCE = 1/1024;
var EPSILON = 1/1048576;


var Triangle = function(v0, v1, v2, reflectivity, emissivity) {
    this.vertexs = [v0, v1, v2];
    this.reflectivity = clamp(reflectivity, 0, 1);
    this.emissivity = clamp(emissivity, 0, Infinity);
    this.edge0 = sub(v1, v0);
    this.edge1 = sub(v2, v1);
    this.edge2 = sub(v2, v0);
};


Triangle.prototype.bound = function() {
    // calculate min and max across all vertexs
    var v = this.vertexs;
    var lower = clamp( clamp( v[0], -Infinity, v[1] ), -Infinity, v[2] );
    var upper = clamp( clamp( v[0], v[1],  Infinity ), v[2],  Infinity );

    // enlarge with some padding (for double precision FP)
    return { lower: sub(lower, Vector3(TOLERANCE)),
             upper: add(upper, Vector3(TOLERANCE)) };
};

// Return a positive number d such that rayOrigin + d * rayDirection
// lies within this triangle, if possible, else null.
Triangle.prototype.intersection = function(rayOrigin, rayDirection) {
    // NB This returns a number or null; the original returns a boolean
    //  along with an output parameter.
    var pvec = cross(rayDirection, this.edge2);
    var det = dot(this.edge0, pvec);
    if (-EPSILON < det && det < EPSILON)
        return null;
    var invDet = 1 / det;
    var tvec = sub(rayOrigin, this.vertexs[0]);
    var u = dot(tvec, pvec) * invDet;
    if (u < 0 || 1 < u)
        return null;
    var qvec = cross(tvec, this.edge0);
    var v = dot(rayDirection, qvec) * invDet;
    if (v < 0 || 1 < u + v)
        return null;
    var hitDistance = dot(this.edge2, qvec) * invDet;
    return 0 <= hitDistance ? hitDistance : null;
};

Triangle.prototype.samplePoint = function(random) {
    var sqr1 = Math.sqrt(random());
    var r2 = random();
    return add(scale(1 - sqr1, this.edge0),
               add(scale((1 - r2) * sqr1, this.edge2),
                   this.vertexs[0]));
};

Triangle.prototype.getNormal = function() {
    return normalize(cross(this.edge0, this.edge1));
};

Triangle.prototype.getTangent = function() {
    return normalize(this.edge0);
};

Triangle.prototype.getArea = function() {
    return 0.5 * norm(cross(this.edge0, this.edge1));
};




// Tests from Clojure port

// load('vector3.js')

// Triangle in xy-plane, reflect 1/2, emit 1
//var xytriangle = Triangle([0,0,0], [1,0,0], [0,1,0], [1/2,1/2,1/2], [1,1,1])

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
