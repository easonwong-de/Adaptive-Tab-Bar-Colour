//Tells background.js what color to use

var response_color = "";
const TRANSPARENT = "rgba(0, 0, 0, 0)";

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
		port.postMessage({ color: response_color });
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
	} else if (reservedColor_cs[host].startsWith("TAG_")) {
		let tag = reservedColor_cs[host].replace("TAG_", "");
		let el_list = document.getElementsByTagName(tag);
		if (el_list.length == 0)
			return false;
		response_color = getColorFrom(el_list[0]);
		if (response_color == TRANSPARENT)
			return false;
	} else if (reservedColor_cs[host].startsWith("CLASS_")) {
		let className = reservedColor_cs[host].replace("CLASS_", "");
		let el_list = document.getElementsByClassName(className);
		if (el_list.length == 0)
			return false;
		response_color = getColorFrom(el_list[0]);
		if (response_color == TRANSPARENT)
			return false;
	} else if (reservedColor_cs[host].startsWith("ID_")) {
		let id = reservedColor_cs[host].replace("ID_", "");
		let el = document.getElementById(id);
		if (el == null)
			return false;
		response_color = getColorFrom(el);
		if (response_color == TRANSPARENT)
			return false;
	} else if (reservedColor_cs[host].startsWith("NAME_")) {
		let name = reservedColor_cs[host].replace("NAME_", "");
		let el_list = document.getElementsByName(name);
		if (el_list.length == 0)
			return false;
		response_color = getColorFrom(el_list[0]);
		if (response_color == TRANSPARENT)
			return false;
	} else {
		response_color = reservedColor_cs[host];
		//Only hex color is accepted
		let reg = /^#([0-9a-f]{3}){1,2}$/i;
		return reg.test(response_color);
	}
	//response color can be transparent due to getColorFrom()
	return response_color != "" && response_color != TRANSPARENT;
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
	let color = ANY_to_RGBA(TRANSPARENT);
	let element = document.elementFromPoint(window.innerWidth / 2, 3);
	for (element; element; element = element.parentElement) {
		//Only if the element is wide and thick enough will it be included in the calculation
		if (element.offsetWidth / window.innerWidth >= 0.9 && element.offsetHeight >= 20)
			color = overlayColor(color, ANY_to_RGBA(getColorFrom(element)));
	}
	//If the color is still not opaque, mix it with the color of the body
	//If the body is not opaque, mix it with #ECECEC
	if (color.a != 1) {
		let body = document.getElementsByTagName("body")[0];
		if (body == undefined) {
			color = overlayColor(color, ANY_to_RGBA("#ECECEC"));
		} else {
			let body_color = getColorFrom(body);
			color = overlayColor(color, ANY_to_RGBA(body_color.includes("rgba") ? "#ECECEC" : getColorFrom(body)));
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
	if (color == null) color = TRANSPARENT;
	return color;
}

function generateColorObj(params) {
	
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
 * Add up colors
 * 
 * @param {object} top Color on top
 * @param {object} bottom Color underneath
 * @returns Result of the addition in object
 */
function overlayColor(top, bottom) {
	let a = (1 - top.a) * bottom.a + top.a;
	if (a == 0) {
		// Firefox renders transparent background in this color
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