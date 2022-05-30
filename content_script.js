//Tells background.js what color to use

var response_color = "";

/* darkMode: true => white text
darkMode: false => balck text
reserved color is a color => it is the theme color
reserved color is a IGNORE => use calculated color as theme color
reserved color is a tag name => theme color is stored under that tag
reserved color is a class name => theme color is stored under that class */
const reservedColor_cs = {
	"open.spotify.com": "rgb(0, 0, 0)",
	"mail.google.com": "CLASS: wl",
	"www.youtube.com": "TAG: ytd-masthead",
	"www.twitch.tv": "CLASS: top-nav__menu",
	"www.apple.com": "TAG: nav",
	"github.com": "IGNORE_THEME",
	"developer.mozilla.org": "IGNORE_THEME"
};

var port;

findColor();

/**
 * Finds color and send to background.
 */
function findColor() {
	port = browser.runtime.connect();
	if (!findColorReserved()) findColorUnreserved();
	if (!document.hidden) port.postMessage({ color: response_color });
}

//Updates color when user makes action
//hopefully clicking a color scheme changing button
//experimental
//document.onclick = findColor;
//document.onwheel = findColor;
//document.onscroll = findColor;

//Updates color when Dark Reader changes mode
var onDarkReader = new MutationObserver(findColor);
onDarkReader.observe(document.documentElement, { attributes: true, attributeFilter: ["data-darkreader-mode"] });

//Remind background.js of the color
browser.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
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
	if (reservedColor_cs[host] == null) {
		return false;
	} else if (reservedColor_cs[host] == "IGNORE_THEME") {
		response_color = getComputedColor();
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
	if (color.a != 1) {
		let body = document.getElementsByTagName("body");
		if (body.length == 0) {
			color = "";
		} else {
			color = getColorFrom(body[0]);
			if (color.includes("rgba")) color = "";
		}
		return color;
	} else {
		return "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
	}
}

/**
 * @param {element} element 
 * @returns The color of the element in string, transparent if null
 */
function getColorFrom(element) {
	let color = getComputedStyle(element).backgroundColor;
	return color ? color : "rgba(0, 0, 0, 0)";
}