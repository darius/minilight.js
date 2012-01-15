var PPM_ID = 'P6';
var MINILIGHT_URI = 'http://www.hxa7241.org/minilight/';
var DISPLAY_LUMINANCE_MAX = 200;
var RGB_LUMINANCE = Vector3(0.2126, 0.7152, 0.0722);
var GAMMA_ENCODE = 0.45;

function Image(width, height) {
    var npixels = width * height;
    var pixels = new Array(npixels * 3);

    function calculateToneMapping(pixels, divider) {
        var sum_of_logs = 0;
        for (var i = 0; i < npixels; ++i) {
            var pixel = Vector3(pixels[3*i], pixels[3*i+1], pixels[3*i+2]);
            var y = scale(divider, dot(Vector3(pixel, RGB_LUMINANCE)));
            sum_of_logs += log10(Math.max(y, 1e-4));
        }
        var log_mean_luminance = Math.pow(10, sum_of_logs / npixels);
        var a = 1.219 + Math.pow(DISPLAY_LUMINANCE_MAX * 0.25, 0.4);
        var b = 1.219 + Math.pow(log_mean_luminance, 0.4);
        return Math.pow(a / b, 2.5) / DISPLAY_LUMINANCE_MAX;
    }

    return {
        width: width,
        height: height,
        addToPixel: function(x, y, radiance) {
            if (0 <= x && x < width && 0 <= y && y < height) {
                var index = (x + ((height - 1 - y) * width)) * 3;
                pixels[index+0] += radiance[0];
                pixels[index+1] += radiance[1];
                pixels[index+2] += radiance[2];
            }
        },
        save: function(iteration) {
            var divider = 1 / (1 + Math.max(iteration, 0));
            var tonemapScaling = calculateToneMapping(pixels, divider);
            var out = '';
            out += PPM_ID;
            out += '\n# ' + MINILIGHT_URI + '\n\n';
            out += '' + width + ' ' + height + '\n255\n';
            for (var i = 0; i < pixels.length; ++i) {
                var channel = pixels[i];
                var mapped = channel * divider * tonemapScaling;
                var gammaed = Math.pow(Math.max(mapped, 0), GAMMA_ENCODE);
                out += String.fromCharCode(
                    Math.min(Math.floor((gammaed * 255) + 0.5), 255));
            }
            return out;
        },
    };
}

function log10(x) {
    return Math.log(x) / Math.LN10;
}
