//Tells background.js what color to use

var response_color = "";

/* darkMode: true => white text
darkMode: false => balck text
reserved color is a color => it is the theme color
reserved color is a IGNORE => use calculated color as theme color
reserved color is a tag name => theme color is stored under that tag
reserved color is a class name => theme color is stored under that class */
const reservedColor_cs = {
	"open.spotify.com": "#000000",
	"mail.google.com": "CLASS: wl",
	"github.com": "IGNORE_THEME",
	"www.youtube.com": "IGNORE_THEME",
	"developer.mozilla.org": "IGNORE_THEME",
	"www.instagram.com": "IGNORE_THEME"
};

var port;

findColor();

/**
 * Finds color and send to background.
 */
function findColor() {
	if (document.fullscreenElement == null) {
		if (!findColorReserved()) findColorUnreserved();
		sendColor();
	}
}

function sendColor() {
	if (!document.hidden) {
		port = browser.runtime.connect();
		port.postMessage({ color: response_color });
	}
}

//Updates color when Dark Reader changes mode
var ondarkreader = new MutationObserver(findColor);
ondarkreader.observe(document.documentElement, { attributes: true, attributeFilter: ["data-darkreader-mode"] });

//Fired by update() from background.js
browser.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.dynamic) {
			findColor();
			document.onclick = findColor;
			document.onwheel = findColor;
			document.onscroll = findColor;
		} else {
			sendColor();
			document.onclick = null;
			document.onwheel = null;
			document.onscroll = null;
		}
		sendResponse("Color sended.");
	}
);

/**
 * Sets response_color.
 * 
 * @returns true if a reserved color for the URl can be found
 */
function findColorReserved() {
	let host = document.location.host; // e.g. "host" can be "www.irgendwas.com"
	if (reservedColor_cs[host] == null) {
		return false;
	} else if (reservedColor_cs[host] == "IGNORE_THEME") {
		response_color = getComputedColor();
		return true;
	} else if (reservedColor_cs[host].startsWith("TAG: ")) {
		let tagName = reservedColor_cs[host].replace("TAG: ", "");
		let el_list = document.getElementsByTagName(tagName);
		if (el_list.length == 0) return false;
		response_color = getColorFrom(el_list[0]);
	} else if (reservedColor_cs[host].startsWith("CLASS: ")) {
		let className = reservedColor_cs[host].replace("CLASS: ", "");
		let el_list = document.getElementsByClassName(className);
		if (el_list.length == 0) return false;
		response_color = getColorFrom(el_list[0]);
	} else {
		response_color = reservedColor_cs[host];
	}
	if (response_color == "") {
		return false;
	} else {
		return true;
	}
}

/**
 * Sets response_color.
 */
function findColorUnreserved() {
	response_color = getThemeColor() ? getThemeColor() : getComputedColor();
}

/** 
 * @returns Provided theme-color e.g. "#ffffff", "rgba(33, 33, 33, 0.98)"
 */
function getThemeColor() {
	//Get theme-color defined by the website html
	headerTag = document.querySelector('meta[name="theme-color"]');
	if (headerTag == null) {
		return null;
	} else {
		let color = headerTag.content;
		if (color.includes("rgba")) color = noAlphaValue(color);
		return color;
	}
}

/**
 * @author emilio on GitHub
 * @returns Background color of the element of the top e.g. "rgb(30, 30, 30)"
 */
function getComputedColor() {
	let color = ANY_to_RGBA("rgba(0, 0, 0, 0)");
	let element = document.elementFromPoint(window.innerWidth / 2, 3);
	for (element; element; element = element.parentElement) {
		if (element.offsetWidth / window.innerWidth >= 0.8 && element.offsetHeight >= 20)
			color = overlayColor(color, ANY_to_RGBA(getColorFrom(element)));
	}
	if (color.a != 1) {
		let body = document.getElementsByTagName("body")[0];
		if (body == undefined) {
			color = overlayColor(color, ANY_to_RGBA("#FFFFFF"));
		} else {
			let body_color = getColorFrom(body);
			color = body_color.includes("rgba") ? overlayColor(color, ANY_to_RGBA("#FFFFFF")) : overlayColor(color, ANY_to_RGBA(getColorFrom(body)));
		}
	}
	return "rgb(" + Math.floor(color.r) + ", " + Math.floor(color.g) + ", " + Math.floor(color.b) + ")";
}

/**
 * @param {element} element 
 * @returns The color of the element in string, transparent if null
 */
function getColorFrom(element) {
	let color = getComputedStyle(element).backgroundColor;
	if (color == null) color = "rgba(0, 0, 0, 0)";
	return color;
}

/**
 * @param {string} color Color in string
 * @returns Color in object
 */
function ANY_to_RGBA(color) {
	if (color.startsWith("#")) {
		return HEXA_to_RGBA(color);
	} else if (color.startsWith("rgb")) {
		return RGBA_to_RGBA(color);
	} else if (color.startsWith("hsl")) {
		return HSLA_to_RGBA(color);
	} else {
		return { r: 0, g: 0, b: 0, a: 0 };
	}
}

/**
 * Converts rgba/rgb (String) to rgba (Object).
 * 
 * @param {string} rgba color in rgba/rgb
 * @returns color in object
 */
function RGBA_to_RGBA(rgba) {
	let result = [0, 0, 0, 0];
	result = rgba.match(/[.?\d]+/g).map(Number);
	if (result.length == 3) result[3] = 1;
	return {
		r: result[0],
		g: result[1],
		b: result[2],
		a: result[3]
	};
}

/**
 * Converts hex(a) (String) to rgba (Object).
 * @author Jon Kantner (modified by Eason Wong)
 * 
 * @param {string} hexa Color in hex(a)
 * @returns Color in object
 */
function HEXA_to_RGBA(hexa) {
	let r = "00", g = "00", b = "00", a = "00";
	switch (hexa.length) {
		case 4:
			r = hexa[1] + hexa[1];
			g = hexa[2] + hexa[2];
			b = hexa[3] + hexa[3];
			break;
		case 5:
			r = hexa[1] + hexa[1];
			g = hexa[2] + hexa[2];
			b = hexa[3] + hexa[3];
			a = hexa[4] + hexa[4];
			break;
		case 7:
			r = hexa[1] + hexa[2];
			g = hexa[3] + hexa[4];
			b = hexa[5] + hexa[6];
			break;
		case 9:
			r = hexa[1] + hexa[2];
			g = hexa[3] + hexa[4];
			b = hexa[5] + hexa[6];
			a = hexa[7] + hexa[8];
			break;
		default:
			break;
	}
	return {
		r: parseInt(r, 16),
		g: parseInt(g, 16),
		b: parseInt(b, 16),
		a: parseInt(a, 16)
	};
}

/**
 * Converts hsl(a) (String) to rgba (Object).
 * @author Jon Kantner (modified by Eason Wong)
 * 
 * @param {string} hsla Color in hsl(a)
 * @returns Color in object
 */
function HSLA_to_RGBA(hsla) {
	let sep = hsla.indexOf(",") > -1 ? "," : " ";
	let hsla_param = hsla.split("(")[1].split(")")[0].split(sep);
	// strip the slash if using space-separated syntax
	if (hsla_param.indexOf("/") > -1)
		hsla_param.splice(3, 1);
	// must be fractions of 1
	let h = hsla_param[0],
		s = hsla_param[1].substring(0, hsla_param[1].length - 1) / 100,
		l = hsla_param[2].substring(0, hsla_param[2].length - 1) / 100,
		a = hsla_param[3] ? hsla_param[3] : 1;
	// strip label and convert to degrees (if necessary)
	if (h.indexOf("deg") > -1)
		h = h.substring(0, h.length - 3);
	else if (h.indexOf("rad") > -1)
		h = Math.round(h.substring(0, h.length - 3) / (2 * Math.PI) * 360);
	else if (h.indexOf("turn") > -1)
		h = Math.round(h.substring(0, h.length - 4) * 360);
	if (h >= 360)
		h %= 360;
	let c = (1 - Math.abs(2 * l - 1)) * s,
		x = c * (1 - Math.abs((h / 60) % 2 - 1)),
		m = l - c / 2,
		r = 0,
		g = 0,
		b = 0;
	if (0 <= h && h < 60) {
		r = c; g = x; b = 0;
	} else if (60 <= h && h < 120) {
		r = x; g = c; b = 0;
	} else if (120 <= h && h < 180) {
		r = 0; g = c; b = x;
	} else if (180 <= h && h < 240) {
		r = 0; g = x; b = c;
	} else if (240 <= h && h < 300) {
		r = x; g = 0; b = c;
	} else if (300 <= h && h < 360) {
		r = c; g = 0; b = x;
	}
	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);
	if (typeof a == "string" && a.indexOf("%") > -1)
		a = a.substring(0, a.length - 1) / 100;
	return {
		r: r,
		g: g,
		b: b,
		a: a / 1
	};
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