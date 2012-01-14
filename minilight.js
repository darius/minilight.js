// TODO: break up calculation into timeslices or use webworkers
function minilight(image, iterations, camera, scene) {
    for (var frameNum = 1; frameNum <= iterations; ++frameNum)
        camera.getFrame(scene, image);
    return image;
}
