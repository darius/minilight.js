function Vector3(x, y, z) {
    if (y === undefined) y = x;
    if (z === undefined) z = y;
    return [x, y, z];
}

function add(u, v) {
    return [u[0] + v[0],
            u[1] + v[1],
            u[2] + v[2]];
}

function sub(u, v) {
    return [u[0] - v[0],
            u[1] - v[1],
            u[2] - v[2]];
}

function mul(u, v) {
    return [u[0] * v[0],
            u[1] * v[1],
            u[2] * v[2]];
}

function scale(c, v) {
    return [c * v[0],
            c * v[1],
            c * v[2]];
}

function neg(v) {
    return scale(-1, v);
}

function isZero(v) {
    return v[0] === 0 && v[1] === 0 && v[2] === 0;
}

function dot(u, v) {
    return (u[0] * v[0]
            + u[1] * v[1]
            + u[2] * v[2]);
}

function norm(v) {
    return Math.sqrt(dot(v, v));
}

function normalize(v) {
    var length = norm(v);
    return scale(length === 0 ? 0 : 1/length, v);
}

function cross(u, v) {
    return [u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]];
}

function clamp(v, lo, hi) {
    return [clip(v[0], lo, hi),
            clip(v[1], lo, hi),
            clip(v[2], lo, hi)];
}

function clip(x, lo, hi) {
    return Math.max(lo, Math.min(x, hi));
}

var ZERO = Vector3(0);          // TODO rename to Origin?


// Tests mostly from Clojure port

/// ZERO
//. 0,0,0
/// Vector3(42)
//. 42,42,42
/// Vector3(1,4,9)
//. 1,4,9

/// var dyn100 = sub([1, 2, 3], [0, 2, 3]);
/// var dyn010 = sub([1, 2, 3], [1, 1, 3]);

/// clamp([2,-1,-1], 0, 1)
//. 1,0,0
/// clamp([.5,.5,.5], 0, 1)
//. 0.5,0.5,0.5

/// dot([1,1,1], [-1,1,0])
//. 0
/// dot([1,2,3], [3,-2,1])
//. 2

/// add([1,1,0], ZERO)
//. 1,1,0
/// add(ZERO, [-2,3,4])
//. -2,3,4
/// add([1,-1,2], [0,3,1])
//. 1,2,3
/// add(dyn100, dyn010)
//. 1,1,0

/// sub([1,2,3], ZERO)
//. 1,2,3
/// sub([1,2,3], [1,2,3])
//. 0,0,0
/// sub([1,2,3], [3,2,1])
//. -2,0,2
/// sub(dyn100, dyn010)
//. 1,-1,0

/// scale(0, [1,2,3])
//. 0,0,0
/// scale(-1, [1,2,3])
//. -1,-2,-3
/// scale(2, [1,2,3])
//. 2,4,6
/// scale(2, dyn100)
//. 2,0,0

/// cross([1,2,3], [4,5,6])
//. -3,6,-3
/// cross([1,0,0], [0,1,0])
//. 0,0,1
/// cross([1,0,0], [1,0,0])
//. 0,0,0
/// cross(dyn100, dyn010)
//. 0,0,1

/// norm(ZERO)
//. 0
/// norm([1,1,1]) === Math.sqrt(3)
//. true
/// norm([1,0,1]) === Math.SQRT2
//. true

/// sub(normalize([2,3,6]), [2/7, 3/7, 6/7])
//. 0,0,0
