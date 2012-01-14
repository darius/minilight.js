// TODO: octree index

function SpatialIndex(things) {
    return {
        // Find the nearest thing intersecting the ray, if any.
        // NB original has out params (hitObject :Triangle, hitPosition :Vector3)
        intersect: function(rayOrigin, rayDirection, lastHit) {
            // (In the full version this code will go into the
            // octree-leaf code.)
            var nearestDistance = INFINITY;
            var hitThing       = null;
            var hitPosition     = ZERO;
            for (var i = 0; i < things.length; ++i) {
                var thing = things[i];
                // Avoid spurious intersection with surface just come from
                if (thing === lastHit) continue;

                var distance = thing.intersect(rayOrigin, rayDirection);
                if (distance !== null && distance < nearestDistance) {
                    nearestDistance = distance;
                    hitThing        = thing;
                    hitPosition     = add(rayOrigin, scale(distance, rayDirection));
                }
            }
            return hitThing === null ? null : [hitThing, hitPosition];
        }
    };
}
