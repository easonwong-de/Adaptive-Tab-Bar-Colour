//Sends color in RGB object (no transparent) to background.js

const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 };
var RESPONSE_COLOR = Object.assign({}, TRANSPARENT);

//preloads default color lookup table
var reservedColor_cs = {
	"developer.mozilla.org": "IGNORE_THEME",
	"github.com": "IGNORE_THEME",
	"mail.google.com": "CLASS_wl",
	"open.spotify.com": "#000000",
	"www.instagram.com": "IGNORE_THEME",
	"www.youtube.com": "IGNORE_THEME"
};

var port;

//Send color to background as soon as page loads
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

/**
 * Sends color to background.
 */
function sendColor() {
	if (!document.hidden) {
		port = browser.runtime.connect();
		port.postMessage({ color: RESPONSE_COLOR });
	}
}

//Updates color when Dark Reader changes mode
var ondarkreader = new MutationObserver(findColor);
ondarkreader.observe(document.documentElement, { attributes: true, attributeFilter: ["data-darkreader-mode"] });

//Fired by update() from background.js
//Loads newly applied settings
browser.runtime.onMessage.addListener(
	(pref, sender, sendResponse) => {
		if (pref.dynamic) {
			document.onclick = findColor;
			document.onwheel = findColor;
			document.onscroll = findColor;
		} else {
			document.onclick = null;
			document.onwheel = null;
			document.onscroll = null;
		}
		reservedColor_cs = pref.reservedColor_cs;
		findColor();
		sendResponse("Color sended to background.");
	}
);

/**
 * Sets RESPONSE_COLOR with the help of reserved color list.
 * 
 * @returns True if a legal reserved color for the webpage can be found.
 */
function findColorReserved() {
	let host = document.location.host;
	//"host" can be "www.irgendwas.com"
	let hostAction = reservedColor_cs[host];
	if (hostAction == null) {
		return false;
	} else if (hostAction == "IGNORE_THEME") {
		findComputedColor();
		return true;
	} else if (hostAction.startsWith("TAG_")) {
		let tag = hostAction.replace("TAG_", "");
		let el_list = document.getElementsByTagName(tag);
		RESPONSE_COLOR = getColorFrom(el_list[0]);
	} else if (hostAction.startsWith("CLASS_")) {
		let className = hostAction.replace("CLASS_", "");
		let el_list = document.getElementsByClassName(className);
		RESPONSE_COLOR = getColorFrom(el_list[0]);
	} else if (hostAction.startsWith("ID_")) {
		let id = hostAction.replace("ID_", "");
		let el = document.getElementById(id);
		RESPONSE_COLOR = getColorFrom(el);
	} else if (hostAction.startsWith("NAME_")) {
		let name = hostAction.replace("NAME_", "");
		let el_list = document.getElementsByName(name);
		RESPONSE_COLOR = getColorFrom(el_list[0]);
	} else {
		RESPONSE_COLOR = ANY_to_OBJ(hostAction);
	}
	//Return ture if reponse color is legal and can be sent to background.js
	return RESPONSE_COLOR != null && RESPONSE_COLOR.a == 1;
}

/**
 * Sets RESPONSE_COLOR using findThemeColor() and findComputedColor().
 */
function findColorUnreserved() {
	if (!findThemeColor()) findComputedColor();
}

/** 
 * Sets RESPONSE_COLOR using theme-color defined by the website HTML.
 * 
 * @returns False if no legal theme-color can be found.
 */
function findThemeColor() {
	headerTag = document.querySelector(`meta[name="theme-color"]`);
	if (headerTag != null) {
		RESPONSE_COLOR = ANY_to_OBJ(headerTag.content);
		//Return true if it is legal and can be sent to background.js
		//Otherwise, return false and trigger getComputedColor()
		return RESPONSE_COLOR.a == 1;
	} else {
		return false;
	}
}

/**
 * Sets REPONSE_COLOR using web elements.
 * 
 * @author emilio on GitHub (modified by Eason Wong)
 */
function findComputedColor() {
	let color_temp0 = Object.assign({}, TRANSPARENT);
	let element = document.elementFromPoint(window.innerWidth / 2, 3);
	for (element; element; element = element.parentElement) {
		//If the color is already opaque, intercept the loop
		if (color_temp0.a == 1)
			break;
		//Only if the element is wide and thick enough will it be included in the calculation
		if (element.offsetWidth / window.innerWidth >= 0.9 && element.offsetHeight >= 20) {
			let color_temp1 = getColorFrom(element);
			//If the element is tranparen, just skip
			if (color_temp1 == TRANSPARENT) continue;
			color_temp0 = overlayColor(color_temp0, color_temp1);
		}
	}
	//If the color is still not opaque, overlay it over the webpage body
	//If the body is not opaque, overlay it over rgb(236, 236, 236)
	//On Firefox Nightly it should be rgb(255, 255, 255)
	if (color_temp0.a != 1) {
		let body = document.getElementsByTagName("body")[0];
		if (body == undefined) {
			color_temp0 = overlayColor(color_temp0, { r: 236, g: 236, b: 236, a: 1 });
		} else {
			let body_color = getColorFrom(body);
			color_temp0 = overlayColor(color_temp0, body_color.a == 1 ? getColorFrom(body) : { r: 236, g: 236, b: 236, a: 1 });
		}
	}
	RESPONSE_COLOR = Object.assign({}, color_temp0);
}

/**
 * @param {HTMLElement} element The element to get color from.
 * @returns The color of the element in object, transparent if null.
 */
function getColorFrom(element) {
	if (element == null) return TRANSPARENT;
	let color = getComputedStyle(element).backgroundColor;
	return (color == null || color == "") ? TRANSPARENT : ANY_to_OBJ(color);
}

/**
 * Overlays one color over another.
 * 
 * @param {object} top Color on top.
 * @param {object} bottom Color underneath.
 * @returns Result of the addition in object.
 */
function overlayColor(top, bottom) {
	let a = (1 - top.a) * bottom.a + top.a;
	if (a == 0) {
		// Firefox renders transparent background in rgb(236, 236, 236)
		return { r: 236, g: 236, b: 236, a: 0 };
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
 * Converts any color to rgba object.
 * @author JayB (modified by Eason Wong)
 * 
 * @param {string} color Color to convert.
 * @returns Color in rgba object.
 */
function ANY_to_OBJ(color) {
	var canvas = document.createElement("canvas").getContext("2d");
	canvas.fillStyle = color
	let color_temp = canvas.fillStyle;
	if (color_temp.startsWith("#")) {
		let r = color_temp[1] + color_temp[2];
		let g = color_temp[3] + color_temp[4];
		let b = color_temp[5] + color_temp[6];
		return {
			r: parseInt(r, 16),
			g: parseInt(g, 16),
			b: parseInt(b, 16),
			a: 1
		};
	} else {
		let result = color_temp.match(/[.?\d]+/g).map(Number);
		return {
			r: result[0],
			g: result[1],
			b: result[2],
			a: result[3]
		};
	}
}