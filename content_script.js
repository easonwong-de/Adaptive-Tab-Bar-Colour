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
	if (response_color.includes("rgba")) response_color = noAplphaValue(response_color);
	if (!document.hidden) Port.postMessage({ color: response_color });
}

//Updates color when user makes action
//hopefully clicking a color scheme changing button
document.onclick = findColor;
document.onwheel = findColor; //experimental
document.onscroll = findColor; //experimental
//Updates color when Dark Reader changes mode
var ondarkreader = new MutationObserver(findColor);
ondarkreader.observe(document.documentElement, { attributes: true, attributeFilter: ["data-darkreader-mode"] });

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
		let el = el_list[0];
		response_color = window.getComputedStyle(el, null).getPropertyValue('background-color');
	} else if (reservedColor[host].startsWith("CLASS: ")) {
		let className = reservedColor[host].replace("CLASS: ", "");
		let el_list = document.getElementsByClassName(className);
		if (el_list.length == 0) return false;
		let el = el_list[0];
		response_color = window.getComputedStyle(el, null).getPropertyValue('background-color');
	} else {
		response_color = reservedColor[host];
	}
	return true;
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

//Remind background.js of the color
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message == "remind_me") {
			findColor();
			sendResponse({});
		}
	}
);

/**
 * @author emilio on GitHub
 * @returns Background color of the element of the top e.g. "rgb(30, 30, 30)"
 */
function getComputedColor() {
	let color = "";
	for (let element = document.elementFromPoint(window.innerWidth / 2, 1); element; element = element.parentElement) {
		color = getComputedStyle(element).backgroundColor;
		if (color != "rgba(0, 0, 0, 0)") return color;
	}
	let body = document.getElementsByTagName("body")[0];
	color = getComputedStyle(body).backgroundColor;
	if (color == "rgba(0, 0, 0, 0)") {
		return "#fff";
	} else {
		return color;
	}
}

/** 
 * @returns Provided theme-color e.g. "#ffffff", "rgba(33, 33, 33, 0.98)"
 */
function getThemeColor() {
	headerTag = document.querySelector('meta[name="theme-color"]'); //Get theme-color defined by the website html
	if (headerTag == null) {
		return null;
	} else {
		return headerTag.content;
	}
}


/**
 * Deletes alpha value from rgba (String).
 * 
 * @param {string} color color in rgba e.g. "rgba(33, 33, 33, 0.98)"
 * @returns color in rgb
 */
function noAplphaValue(color) {
	color = color.replace("rgba", "rgb");
	color = color.slice(0, color.lastIndexOf(","));
	color = color + ")";
	return color;
}