function Scene(skyEmission, groundReflection, triangles) {
    skyEmission = clamp(skyEmission, 0, Infinity);
    groundReflection = mul(skyEmission, clamp(groundReflection, 0, 1));
    var emitters = filter(triangles, glows);
    return {
        intersect: SpatialIndex(triangles).intersect,
        sampleEmitter: function(random) {
            if (emitters.length === 0) return null;
            return sampleArray(self.emitters, random);
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
    return !isZero(triangle.getEmissivity()) && 0 < triangle.getArea();
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
