/** 
 * Returns if dark mode should be used considering the color.
 * 
 * @param {string} color The color to check (hex or rgb)
 * @returns {boolean} "true" => dark mode; "false" => light mode
*/
function isDarkMode(color) {
    if (color == "" || color == null) {
        return null;
    } else {
        if (tooBright(color)) {
            return false;
        } else if (tooDark(color)) {
            return true;
        } else {
            return null;
        }
    }
}

/**
 * Returns if a color is too bright.
 * 
 * @param {string} color The color to check (hex or rgb)
 * @returns {boolean} true if the color is bright
 */
function tooBright(color) {
    return rgbObjBrightness(anyToRgba(color)) > 155;
}

/**
 * Returns if a color is too dark.
 * 
 * @param {string} color The color to check (hex or rgb)
 * @returns {boolean} true if the color is dark
 */
function tooDark(color) {
    return rgbObjBrightness(anyToRgba(color)) < 100;
}

/**
 * Dims or lightens color.
 * 
 * @param {string} color Color to process
 * @param {number} dim between -1.0 (dim) to 1.0 (light)
 * @returns Dimmed or lightened color
 */
function dimColor(color, dim) {
    let color_obj = anyToRgba(color);
    if (dim >= 0) {
        color_obj.r = color_obj.r + dim * (255 - color_obj.r);
        color_obj.g = color_obj.g + dim * (255 - color_obj.g);
        color_obj.b = color_obj.b + dim * (255 - color_obj.b);
    } else {
        color_obj.r = (dim + 1) * color_obj.r;
        color_obj.g = (dim + 1) * color_obj.g;
        color_obj.b = (dim + 1) * color_obj.b;
    }
    return "rgb(" + color_obj.r + ", " + color_obj.g + ", " + color_obj.b + ")";
}

/**
* Add up colors
* 
* @param {object} top Color on top
* @param {object} bottom Color underneath
* @returns Result of the addition in object
*/
function overlayColor(top, bottom) {
    let a = (1 - top.a) * bottom.a + top.a;
    if (a == 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
    } else {
        return {
            r: ((1 - top.a) * bottom.a * bottom.r + top.a * top.r) / a,
            g: ((1 - top.a) * bottom.a * bottom.g + top.a * top.g) / a,
            b: ((1 - top.a) * bottom.a * bottom.b + top.a * top.b) / a,
            a: a
        }
    }
}

/**
 * Gets brightness value from rgb object.
 * 
 * @param {object} rgb color in object
 * @returns brightness of the color
 */
function rgbObjBrightness(rgb) {
    return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

/**
 * @param {string} color Color in string
 * @returns Color in object
 */
function anyToRgba(color) {
    return color.startsWith("#") ? hexToRgba(color) : rgbaToRgba(color);
}

/**
 * Converts hex color (String) to rgb (Object).
 * @author TimDown stackoverflow.com
 * 
 * @param {string} hex color in hex
 * @returns color in object
 */
function hexToRgba(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 1
    } : null;
}

/**
 * Converts rgba/rgb (String) to rgba (Object).
 * 
 * @param {string} rgbaString color in rgba/rgb
 * @returns color in object
 */
function rgbaToRgba(rgbaString) {
    var result = rgbaString.match(/[.?\d]+/g).map(Number);
    if (result.length == 3) result[3] = 1;
    return result ? {
        r: result[0],
        g: result[1],
        b: result[2],
        a: result[3]
    } : null;
}

/**
 * Deletes alpha value from rgba (String).
 * 
 * @param {string} color color in rgba e.g. "rgba(33, 33, 33, 0.98)"
 * @returns color in rgb
 */
function noAlphaValue(color) {
    color = color.replace("rgba", "rgb");
    color = color.slice(0, color.lastIndexOf(","));
    color = color + ")";
    return color;
}