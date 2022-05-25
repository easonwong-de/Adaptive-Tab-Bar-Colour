//Tells background.js what color to use

var response_color = "";

/* darkMode: true => white text
darkMode: false => balck text
reserved color is a color => it is the theme color
reserved color is a IGNORE => use calculated color as theme color
reserved color is a tag name => theme color is stored under that tag
reserved color is a class name => theme color is stored under that class */
const reservedColor = {
	"open.spotify.com": "rgb(0, 0, 0)",
	"mail.google.com": "CLASS: wl",
	"www.youtube.com": "TAG: ytd-masthead",
	"www.twitch.tv": "CLASS: top-nav__menu",
	"www.apple.com": "TAG: nav",
	"github.com": "IGNORE_THEME",
	"developer.mozilla.org": "IGNORE_THEME"
};

var Port;

findColor();

/**
 * Finds color and send to background.
 */
function findColor() {
	Port = browser.runtime.connect();
	if (!findColorReserved()) findColorUnreserved();
	if (!document.hidden) Port.postMessage({ color: response_color });
}

//Updates color when user makes action
//hopefully clicking a color scheme changing button
//experimental
//document.onclick = findColor;
//document.onwheel = findColor;
//document.onscroll = findColor;

//Updates color when Dark Reader changes mode
var ondarkreader = new MutationObserver(findColor);
ondarkreader.observe(document.documentElement, { attributes: true, attributeFilter: ["data-darkreader-mode"] });

//Remind background.js of the color
browser.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message == "remind_me") {
			findColor();
			sendResponse({});
		}
	}
);

/**
 * Sets response_color.
 * 
 * @returns true if a reserved color for the URl can be found
 */
function findColorReserved() {
	let host = document.location.host; // e.g. "host" can be "www.irgendwas.com"
	if (reservedColor[host] == null) {
		return false;
	} else if (reservedColor[host] == "IGNORE_THEME") {
		response_color = getComputedColor();
	} else if (reservedColor[host].startsWith("TAG: ")) {
		let tagName = reservedColor[host].replace("TAG: ", "");
		let el_list = document.getElementsByTagName(tagName);
		if (el_list.length == 0) return false;
		response_color = getColorFrom(el_list[0]);
	} else if (reservedColor[host].startsWith("CLASS: ")) {
		let className = reservedColor[host].replace("CLASS: ", "");
		let el_list = document.getElementsByClassName(className);
		if (el_list.length == 0) return false;
		response_color = getColorFrom(el_list[0]);
	} else {
		response_color = reservedColor[host];
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
	if (getThemeColor() == null) {
		response_color = getComputedColor();
	} else {
		response_color = getThemeColor();
	}
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
	let color = anyToRgba("rgba(0, 0, 0, 0)");
	for (let element = document.elementFromPoint(window.innerWidth / 2, 3); element; element = element.parentElement) {
		color = overlayColor(color, anyToRgba(getColorFrom(element)));
	}
	if (color.a == 0) {
		let body = document.getElementsByTagName("body")[0];
		if (body == undefined) return "";
		color = getColorFrom(body);
		if (color.includes("rgba")) color = "";
		return color;
	} else {
		return "rgb(" + color.r + ", " + color.g + ", " + color.b + ", " + color.a + ")";
	}
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
function anyToRgba(color) {
	if (color.startsWith("#")) {
		return hexToRgba(color);
	} else {
		return rgbaToRgba(color);
	}
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
	hex = hex.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});
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