var iterations = 100; //00;
var image = Image(200, 150);
var camera = Camera([0, 0.75, -2],
                    [0, 0, 1],
                    45);

var scene = Scene([3626, 5572, 5802],  // skyEmission
                  [0.1, 0.09, 0.07],   // groundReflection
                  [Triangle([0, 0, 0], [0, 1, 0], [1, 1, 0],
                            [0.7, 0.7, 0.7], [0, 0, 0])]);

minilight(image, iterations, camera, scene, Math.random);
var pgm = image.save(iterations);
