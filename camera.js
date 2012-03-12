function Camera(viewPosition, viewDirection, viewAngleInDeg) {
    viewDirection = normalize(viewDirection);
    if (isZero(viewDirection))
        viewDirection = Vector3(0, 0, 1);

    var viewAngle = clip(viewAngleInDeg, 10, 160) * (Math.PI/180);

    var up, right = normalize(cross(Vector3(0, 1, 0),
                                    viewDirection));
    if (!isZero(right))
        up = normalize(cross(viewDirection, right));
    else {
        up = Vector3(0, 0, (viewDirection[1] < 0 ? 1 : -1));
        right = normalize(cross(up, viewDirection));
    }

    return {
        eyePosition: function() { return viewPosition },
        getFrame: function(scene, image, random) {
            var raytracer = RayTracer(scene);
            var aspect = image.height / image.width;
            for (var y = 0; y < image.height; ++y)
                for (var x = 0; x < image.width; ++x) {
                    var xCoeff = ((x + random()) * 2 / image.width) - 1;
                    var yCoeff = ((y + random()) * 2 / image.height) - 1;
                    var offset = add(scale(xCoeff, right),
                                     scale(yCoeff * aspect, up));
                    var sampleDirection =
                        normalize(add(viewDirection,
                                      scale(Math.tan(viewAngle * 0.5),
                                            offset)));
                    var radiance =
                        raytracer.getRadiance(viewPosition, sampleDirection,
                                              random, null);
                    image.addToPixel(x, y, radiance);
                }
        }
    };
}
