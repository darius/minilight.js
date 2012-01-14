// A surface point at a ray-object intersection.
// All direction parameters are unit vectors away from the surface.
function SurfacePoint(triangle, position) {
    return {
        triangle: triangle,
        position: position,

        // XXX improve comment
        // Return the vector of emission values from the surface to
        // toPosition. The unit vector outDirection is the main
        // direction of the emission and the boolean isSolidAngle
        // determines whether the emission is scaled by distance.
        getEmission: function(toPosition, outDirection, isSolidAngle) {
            var cosArea = (dot(outDirection, triangle.getNormal())
                           * triangle.getArea());
            if (cosArea <= 0)
                return ZERO;   // Emit from front face of surface only
            var ray = sub(toPosition, position);
            var distance2 = dot(ray, ray);
            var solidAngle =
                isSolidAngle ? cosArea / Math.max(distance2, 1e-6) : 1;
            return scale(solidAngle, triangle.getEmissivity());
        },

        // Return the reflected radiance resulting from inRadiance
        // scattering off the surface from -inDirection to outDirection.
        getReflection: function(inDirection, inRadiance, outDirection) {
            var normal = triangle.getNormal();
            var inDot  = dot(inDirection, normal);
            var outDot = dot(outDirection, normal);
            // Directions must be on same side of surface (no transmission)
            if ((inDot < 0) !== (outDot < 0))
                return ZERO;
            // Ideal diffuse BRDF:
            // radiance scaled by reflectivity, cosine, and 1/pi
            return mul(scale(Math.abs(inDot) / Math.PI, inRadiance),
                       triangle.getReflectivity());
        },

        // Return the next direction and color vectors of a ray from
        // -inDirection bouncing off the surface, or null. (Monte carlo.)
        getNextDirection: function(random, inDirection) {
            var reflectivityMean = dot(triangle.getReflectivity(), ONE_THIRD);

            // Russian roulette for reflectance magnitude
            if (reflectivityMean <= random())
                return null;

            // Cosine-weighted importance sample hemisphere
            var _2pr1 = (2*Math.PI) * random();
            var sr2   = Math.sqrt(random());
            // Make coord frame coefficients (z in normal direction)
            var x = Math.cos(_2pr1) * sr2;
            var y = Math.sin(_2pr1) * sr2;
            var z = Math.sqrt(1 - sr2 * sr2);

            // Make coord frame
            var tangent = triangle.getTangent();
            var normal  = triangle.getNormal();
            // Put normal on inward-ray side of surface (preventing transmission)
            if (dot(normal, inDirection) < 0)
                normal = neg(normal);

            // Make vector from frame scaled by coefficients
            var outDirection = x * tangent + y * cross(normal, tangent) + z * normal;
            if (isZero(outDirection))
                return null;
            var color = scale(1 / reflectivityMean, triangle.getReflectivity());
            return [outDirection, color];
        },
    };
}

var ONE_THIRD = Vector3(1/3);
