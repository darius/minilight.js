"use strict";
var iterations = 10; //00;
var image = Image(200, 150);
var camera = Camera([0, 0.75, -2],
                    [0, 0, 1],
                    45);

var scene = Scene([3626, 5572, 5802],  // skyEmission
                  [0.1, 0.09, 0.07],   // groundReflection
                  [new Triangle([0, 0, 0], [0, 1, 0], [1, 1, 0],
                                [0.7, 0.7, 0.7], [0, 0, 0])],
                  camera.eyePosition());

minilight(image, iterations, camera, scene, randomCreate());
var pgm = image.save(iterations);
