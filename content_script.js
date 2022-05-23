//Content script tells background.js what color to use

var Response_color = "";

//darkMode: true => white text
//darkMode: false => balck text
//reserved color is a color => it is the theme color
//reserved color is a IGNORE => use calculated color as theme color
//reserved color is a tag name => theme color is stored under that tag
//reserved color is a class name => theme color is stored under that class
const reservedColor = {
	"open.spotify.com": "rgb(0, 0, 0)",
	"mail.google.com": "CLASS: wl",
	"www.youtube.com": "TAG: ytd-masthead",
	"www.twitch.tv": "CLASS: top-nav__menu",
	"www.apple.com": "TAG: nav",
	"github.com": "TAG: header"
};

var Port;

findColor();

//Find the best color
function findColor() {
	Port = browser.runtime.connect();
	if (!findColorReserved()) findColorUnreserved();
	//Sent color to background.js
	if (!document.hidden) Port.postMessage({ color: Response_color });
}

//When there is a reserved color for the url
function findColorReserved() {
	let host = document.location.host; // e.g. "host" can be "www.irgendwas.com"
	if (reservedColor[host] == null) {
		return false;
	} else if (reservedColor[host] == "IGNORE_THEME") {
		Response_color = getComputedColor();
	} else if (reservedColor[host].startsWith("TAG: ")) {
		let tagName = reservedColor[host].replace("TAG: ", "");
		let el_list = document.getElementsByTagName(tagName);
		if (el_list.length == 0) return false;
		let el = el_list[0];
		Response_color = window.getComputedStyle(el, null).getPropertyValue('background-color');
	} else if (reservedColor[host].startsWith("CLASS: ")) {
		let className = reservedColor[host].replace("CLASS: ", "");
		let el_list = document.getElementsByClassName(className);
		if (el_list.length == 0) return false;
		let el = el_list[0];
		Response_color = window.getComputedStyle(el, null).getPropertyValue('background-color');
	} else {
		Response_color = reservedColor[host];
	}
	return true;
}

function findColorUnreserved() {
	if (getThemeColor() == null) {
		Response_color = getComputedColor();
	} else {
		Response_color = getThemeColor();
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

//Contributed by @emilio on GitHub
//Get computed background color e.g. "rgb(30, 30, 30)"
function getComputedColor() {
	let DarkReader = document.getElementsByTagName("HTML")[0].getAttribute("data-darkreader-scheme") != null;
	let color = null;
	let color_last = null;
	for (let el = document.elementFromPoint(window.innerWidth / 2, 1); el; el = el.parentElement) {
		let temp_color = getComputedStyle(el).backgroundColor;
		if (temp_color != "rgba(0, 0, 0, 0)") {
			color_last = color;
			color = temp_color;
		}
	}
	if (DarkReader && color_last != null) color = color_last;
	if (color == null) {
		color = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
		if (color == "rgba(0, 0, 0, 0)") color = "rgb(255, 255, 255)"; //Sometimes computed color lies
	}
	return color;
}

//Get provided theme-color e.g. "#ffffff", "rgba(30, 30, 30, 0.9)"
function getThemeColor() {
	headerTag = document.querySelector('meta[name="theme-color"]'); //Get theme-color defined by the website html
	if (headerTag == null) {
		return null;
	} else {
		return headerTag.content;
	}
}