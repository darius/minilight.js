// Ray tracer for general light transport.

// Traces a path with emitter sampling: A single chain of ray-steps advances
// from the eye into the scene with one sampling of emitters at each node.

"use strict";

function RayTracer(scene) {

    // Return eyeward radiance. lastHit is a triangle or null.
    function getRadiance(rayOrigin, rayDirection, random, lastHit) {
        var tmp = scene.intersect(rayOrigin, rayDirection, lastHit);
        if (tmp === null)
            return scene.getDefaultEmission(neg(rayDirection));
        var surfacePoint = SurfacePoint(tmp[0], tmp[1]);
        var localEmission = 
            lastHit ? ZERO : surfacePoint.getEmission(rayOrigin, 
                                                      neg(rayDirection),
                                                      false);
        var illumination = sampleEmitters(rayDirection, surfacePoint, random);
        var reflection = ZERO;
        tmp = surfacePoint.getNextDirection(random, neg(rayDirection));
        if (tmp) {
            var nextDirection = tmp[0], color = tmp[1];
            reflection = mul(color, getRadiance(surfacePoint.position,
                                                nextDirection,
                                                random,
                                                surfacePoint.triangle));
        }
        return add(localEmission, add(reflection, illumination));
    }

    // Return radiance from an emitter sample
    function sampleEmitters(rayDirection, surfacePoint, random) {
        var emitter = scene.sampleEmitter(random);
        if (!emitter) return ZERO;
        var position = emitter.samplePoint(random);
        var direction = normalize(sub(position, surfacePoint.position));
        // Does the ray from surfacePoint to position see it, unoccluded?
        var hit = scene.intersect(surfacePoint.position, direction,
                                  surfacePoint.triangle);
        if (hit && hit[0] !== emitter)
            return ZERO;        // No, it's occluded.
        var emissionIn =
            SurfacePoint(emitter, position).getEmission(surfacePoint.position,
                                                        neg(direction),
                                                        true);
        return surfacePoint.getReflection(direction,
                                          scale(scene.countEmitters(), emissionIn),
                                          neg(rayDirection));
    }

    return {
        getRadiance: getRadiance,
    };
}
