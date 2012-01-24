"use strict";

var PPM_ID = 'P6';
var MINILIGHT_URI = 'http://www.hxa7241.org/minilight/';
var DISPLAY_LUMINANCE_MAX = 200;
var RGB_LUMINANCE = Vector3(0.2126, 0.7152, 0.0722);
var GAMMA_ENCODE = 0.45;

function Image(width, height) {
    var npixels = width * height;
    var pixels = [];
    for (var i = 0; i < 3 * npixels; ++i)
        pixels.push(0);

    function makeScaler(iteration) {
        var divider = 1 / (1 + Math.max(iteration, 0));
        var scale = calculateToneMapping(divider);
        scale *= divider;
        return function(channel) {
            var gammaed = Math.pow(Math.max(channel * scale, 0), GAMMA_ENCODE);
            return Math.min(Math.round(gammaed * 255), 255);
        };
    }
            
    function calculateToneMapping(divider) {
        var sum_of_logs = 0;
        for (var i = 0; i < npixels; ++i) {
            var pixel = Vector3(pixels[3*i], pixels[3*i+1], pixels[3*i+2]);
            var y = divider * dot(pixel, RGB_LUMINANCE);
            sum_of_logs += Math.log(Math.max(y, 1e-4));
        }
        var log_mean_luminance = Math.exp(sum_of_logs / npixels);
        var a = 1.219 + Math.pow(DISPLAY_LUMINANCE_MAX * 0.25, 0.4);
        var b = 1.219 + Math.pow(log_mean_luminance, 0.4);
        return Math.pow(a / b, 2.5) / DISPLAY_LUMINANCE_MAX;
    }

    return {
        pixels: pixels,
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
            var scaler = makeScaler(iteration);
            var out = '';
            out += PPM_ID;
            out += '\n# ' + MINILIGHT_URI + '\n\n';
            out += '' + width + ' ' + height + '\n255\n';
            for (var i = 0; i < pixels.length; ++i)
                out += String.fromCharCode(scaler(pixels[i]));
            return out;
        },

        blit: function(imageData, iteration) {
            if (imageData.width !== width || imageData.height !== height)
                throw "Canvas dimensions mismatch";
            var scaler = makeScaler(iteration);
            var p = 0;
            for (var i = 0; i < pixels.length; i += 3) {
                imageData.data[p++] = scaler(pixels[i]);
                imageData.data[p++] = scaler(pixels[i+1]);
                imageData.data[p++] = scaler(pixels[i+2]);
                imageData.data[p++] = 0xFF;
            }
        },
    };
}
