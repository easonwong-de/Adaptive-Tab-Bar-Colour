//Sends color in RGBA object to background.js
//If A in RGBA is not 1, falls back to default color.

var RESPONSE_COLOR = rgba([0, 0, 0, 0]);

//preloads default color lookup table
var reservedColor_cs = {
	"developer.mozilla.org": "IGNORE_THEME",
	"github.com": "IGNORE_THEME",
	"mail.google.com": "CLASS_wl",
	"open.spotify.com": "#000000",
	"www.bbc.com": "IGNORE_THEME",
	"www.instagram.com": "IGNORE_THEME",
	"www.spiegel.de": "IGNORE_THEME",
	"www.youtube.com": "IGNORE_THEME"
};

//This will be displayed in the pop-up
var info = "CONTENT_SCRIPT";

//Send color to background as soon as page loads
findAndSendColor();

/**
 * Finds color.
 */
function findColor() {
	if (document.fullscreenElement == null) {
		RESPONSE_COLOR = rgba([0, 0, 0, 0]);
		if (!findColorReserved()) findColorUnreserved();
	}
}

/**
 * Finds color and send to background.
 */
function findAndSendColor() {
	if (document.fullscreenElement == null) {
		RESPONSE_COLOR = rgba([0, 0, 0, 0]);
		if (!findColorReserved()) findColorUnreserved();
		if (document.visibilityState == "visible") sendColor();
	}
}

/**
 * Sends color to background.
 */
function sendColor() {
	browser.runtime.connect().postMessage({ color: RESPONSE_COLOR });
}

//Updates color when Dark Reader changes mode
var ondarkreader = new MutationObserver(findAndSendColor);
ondarkreader.observe(document.documentElement, { attributes: true, attributeFilter: ["data-darkreader-mode"] });

//Fired by update() from background.js
//Loads newly applied settings
browser.runtime.onMessage.addListener(
	(pref, sender, sendResponse) => {
		if (pref.dynamic) {
			document.onclick = findAndSendColor;
			document.onwheel = findAndSendColor;
			document.onscroll = findAndSendColor;
		} else {
			document.onclick = null;
			document.onwheel = null;
			document.onscroll = null;
		}
		reservedColor_cs = structuredClone(pref.reservedColor_cs);
		if (pref.reason == "INFO_REQUEST") {
			findColor();
		} else {
			findAndSendColor();
		}
		sendResponse(info);
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
		info = `Theme color defined by the website is ignored
		<label id="info_action" title="Use theme color defined by the website">
		<span>Use theme color</span>
		</label>`;
		return true;
	} else if (hostAction.startsWith("TAG_")) {
		let tag = hostAction.replace("TAG_", "");
		let el_list = document.getElementsByTagName(tag);
		RESPONSE_COLOR = getColorFrom(el_list[0]);
		info = `Color is picked from an HTML element with the tag: ${tag}`;
	} else if (hostAction.startsWith("CLASS_")) {
		let className = hostAction.replace("CLASS_", "");
		let el_list = document.getElementsByClassName(className);
		RESPONSE_COLOR = getColorFrom(el_list[0]);
		info = `Color is picked from an HTML element under a class: ${className}`;
	} else if (hostAction.startsWith("ID_")) {
		let id = hostAction.replace("ID_", "");
		let el = document.getElementById(id);
		RESPONSE_COLOR = getColorFrom(el);
		info = `Color is picked from an HTML element with the ID: ${id}`;
	} else if (hostAction.startsWith("NAME_")) {
		let name = hostAction.replace("NAME_", "");
		let el_list = document.getElementsByName(name);
		RESPONSE_COLOR = getColorFrom(el_list[0]);
		info = `Color is picked from an HTML element with a name: ${name}`;
	} else {
		RESPONSE_COLOR = rgba(hostAction);
		info = `Color is specified in the settings`;
	}
	//Return ture if reponse color is legal and can be sent to background.js
	return RESPONSE_COLOR != null && RESPONSE_COLOR.a == 1;
}

/**
 * Sets RESPONSE_COLOR using findThemeColor() and findComputedColor().
 */
function findColorUnreserved() {
	findThemeColor() ? info = `Using theme color defined by the website
		<label id="info_action" title="Ignore theme color defined by the website">
		<span>Ignore theme color</span>
		</label>` : findComputedColor();
}

/** 
 * Sets RESPONSE_COLOR using theme-color defined by the website HTML, or preset color for image / plain text viewer.
 * 
 * @returns False if no legal theme-color can be found.
 */
function findThemeColor() {
	if (getComputedStyle(document.documentElement).backgroundImage == "url(\"chrome://global/skin/media/imagedoc-darknoise.png\")") {
		//Image viewer
		//Firefox chooses imagedoc-darknoise.png as the background of image viewer
		RESPONSE_COLOR = "DARKNOISE";
		return true;
	} else if (document.getElementsByTagName("link").length > 0
		&& document.getElementsByTagName("link")[0].href == "resource://content-accessible/plaintext.css") {
		//Plain text viewer
		RESPONSE_COLOR = "PLAINTEXT";
		return true;
	} else {
		let colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		let headerTag = document.querySelector(`meta[name="theme-color"][media="(prefers-color-scheme: ${colorScheme})"]`);
		if (headerTag == null) headerTag = document.querySelector(`meta[name="theme-color"]`);
		if (headerTag != null) {
			RESPONSE_COLOR = rgba(headerTag.content);
			//Return true if it is legal and can be sent to background.js
			//Otherwise, return false and trigger getComputedColor()
			return RESPONSE_COLOR.a == 1;
		} else {
			return false;
		}
	}
}

/**
 * Sets REPONSE_COLOR using web elements.
 * 
 * @author emilio on GitHub (modified by Eason Wong)
 */
function findComputedColor() {
	let color_temp0 = rgba([0, 0, 0, 0]);
	let element = document.elementFromPoint(window.innerWidth / 2, 3);
	for (element; element; element = element.parentElement) {
		//If the color is already opaque, intercept the loop
		if (color_temp0.a == 1) break;
		//Only if the element is wide and thick enough will it be included in the calculation
		if (element.offsetWidth / window.innerWidth >= 0.9 && element.offsetHeight >= 20) {
			let color_temp1 = getColorFrom(element);
			//If the element is tranparen, just skip
			if (color_temp1.a == 0) continue;
			color_temp0 = overlayColor(color_temp0, color_temp1);
		}
	}
	cc(RESPONSE_COLOR, color_temp0);
	//If the color is still not opaque, overlay it over the webpage body
	//If the body is not opaque, overlay it over rgb(236, 236, 236)
	//On Firefox Nightly it should be rgb(255, 255, 255)
	if (RESPONSE_COLOR.a != 1) {
		let body = document.getElementsByTagName("body")[0];
		if (body == undefined) {
			RESPONSE_COLOR = "DEFAULT";
			info = "No color is available, fallback to default color";
		} else {
			let body_color = getColorFrom(body);
			if (body_color.a == 1) {
				RESPONSE_COLOR = overlayColor(RESPONSE_COLOR, body_color);
				info = "Color is successfully picked from the website";
			} else {
				RESPONSE_COLOR = "DEFAULT";
				info = "No color is available, fallback to default color";
			}
		}
	} else {
		info = "Color is successfully picked from the website";
	}
}

/**
 * @param {HTMLElement} element The element to get color from.
 * @returns The color of the element in object, transparent if null.
 */
function getColorFrom(element) {
	if (element == null) return rgba([0, 0, 0, 0]);
	let color = getComputedStyle(element).backgroundColor;
	return color == null ? rgba([0, 0, 0, 0]) : rgba(color);
}

/**
 * Overlays one color over another.
 * 
 * @param {Object} top Color on top.
 * @param {Object} bottom Color underneath.
 * @returns Result of the addition in object.
 */
function overlayColor(top, bottom) {
	let a = (1 - top.a) * bottom.a + top.a;
	if (a == 0) {
		// Firefox renders transparent background in rgb(236, 236, 236)
		return rgba([236, 236, 236, 0]);
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
 * @param {string | Number[]} color Color to convert.
 * @returns Color in rgba object. Pure black if invalid.
 */
function rgba(color) {
	if (typeof color == "string") {
		if (color == "DEFAULT" || color == "DARKNOISE" || color == "PLAINTEXT") return color;
		var canvas = document.createElement("canvas").getContext("2d");
		canvas.fillStyle = color;
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
	} else {
		return { r: color[0], g: color[1], b: color[2], a: color[3] };
	}
}

/**
 * Copies colors.
 * 
 * @param {Object} target Target color object.
 * @param {Object} source Source color object.
 */
function cc(target, source) {
	target.r = source.r;
	target.g = source.g;
	target.b = source.b;
	target.a = source.a;
}

//Passes coloring info to pop-up
info;