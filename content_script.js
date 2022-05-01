//Content script tells background.js what color to use
//and in which color should the text in tab bar be displayed

var responseColor = "";
var darkMode = null;

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
	"github.com": "TAG: header"
};

var port = browser.runtime.connect();

findColor();

//Find the best color
function findColor() {
	if (!findColorReserved()) findColorUnreserved();
	//Make sure there will be no alpha value transmitted to background.js
	if (responseColor.startsWith("rgba")) responseColor = noAplphaValue(responseColor);
	//Sent color to background.js
	if (!document.hidden) port.postMessage({color: responseColor, darkMode: darkMode});
}

//When there is a reserved color for the url
function findColorReserved() {
	let host = document.location.host; // e.g. "host" can be "www.irgendwas.com"
	if (reservedColor[host] == null){
		return false;
	}else if (reservedColor[host] == "IGNORE_THEME"){
		responseColor = getComputedColor();
	}else if (reservedColor[host].startsWith("TAG: ")){
		let tagName = reservedColor[host].replace("TAG: ", "");
		let el_list = document.getElementsByTagName(tagName);
		if (el_list.length == 0) return false;
		let el = el_list[0];
		responseColor = window.getComputedStyle(el, null).getPropertyValue('background-color');
	}else if (reservedColor[host].startsWith("CLASS: ")){
		let className = reservedColor[host].replace("CLASS: ", "");
		let el_list = document.getElementsByClassName(className);
		if (el_list.length == 0) return false;
		let el = el_list[0];
		responseColor = window.getComputedStyle(el, null).getPropertyValue('background-color');
	}else{
		responseColor = reservedColor[host];
	}
	setDarkMode();
	return true;
}

//When there isn't a reserved color for the url
//dark&light mode decides the color of the tab text, button icons etc.
//theme-color is provided by website: getThemeColor()
//background is computed: getComputedColor()
//A: no theme-color exists, background is dark => returns background & in dark mode
//B: no theme-color exists, background is bright => returns background & in light mode
//C: theme-color is bright, background is dark => returns background & in dark mode
//D: theme-color is dark, background is bright => returns theme-color & in dark mode
//E: both are bright => returns theme-color & in light mode
//F: both are dark => returns theme-color & in dark mode
//v1.3.1 update:
//0-100 too dark => darkMode = true
//100-155 not too dark, not too bright => darkMode = null, let pref.scheme decide text color
//155-255 too bright => darkMode = false
function findColorUnreserved() {
	if (getThemeColor() == null){ //A,B
		responseColor = getComputedColor();
	}else{ //C,D,E,F
		let themeColor = "";
		let backgroundColor = "";
		themeColor = getThemeColor();
		backgroundColor = getComputedColor();
		if (tooBright(themeColor) && !tooBright(backgroundColor)){ //C
			responseColor = backgroundColor;
		}else if (!tooBright(themeColor) && tooBright(backgroundColor)){ //D
			responseColor = themeColor;
		}else if (tooBright(themeColor) && tooBright(backgroundColor)){ //E
			responseColor = themeColor;
		}else if (!tooBright(themeColor) && !tooBright(backgroundColor)){ //F
			responseColor = themeColor;
		}
	}
	setDarkMode();
}

//Remind background.js of the color
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message == "remind_me"){
			sendResponse({});
			findColor();
		}
	}
);

//Contributed by @emilio on GitHub
//Get computed background color e.g. "rgb(30, 30, 30)"
function getComputedColor() {
	let color = null;
	for (let el = document.elementFromPoint(window.innerWidth / 2, 1); el; el = el.parentElement) {
		let temp_color = getComputedStyle(el).backgroundColor;
		if (temp_color != "rgba(0, 0, 0, 0)")
			color = temp_color;
	}
	if (color == null){
		color = window.getComputedStyle(document.body,null).getPropertyValue('background-color');
		if (color == "rgba(0, 0, 0, 0)") color = "rgb(255, 255, 255)"; //Sometimes computed color lies
	}
	return color;
}

//Get provided theme-color e.g. "#ffffff", "rgba(30, 30, 30, 0.9)"
function getThemeColor() {
	headerTag = document.querySelector('meta[name="theme-color"]'); //Get theme-color defined by the website html
	if (headerTag == null){
		return null;
	}else{
		return headerTag.content;
	}
}

function setDarkMode() {
	if (responseColor == "" || responseColor == null){
		darkMode = null;
	}else{
		if (tooBright(responseColor)){
			darkMode = false;
		}else if (tooDark(responseColor)){
			darkMode = true;
		}else{
			darkMode = null;
		}
	}
}

//Check if the color is too bright for dark mode
function tooBright(string) {
	if (string.startsWith("#")){
		return hexBrightness(string) > 155;
	}else{
		return rgbBrightness(string) > 155;
	}
}

//Check if the color is too bright for dark mode
function tooDark(string) {
	if (string.startsWith("#")){
		return hexBrightness(string) < 100;
	}else{
		return rgbBrightness(string) < 100;
	}
}

//rgba (String) to brightness
function rgbBrightness(rgba) {
	rgbaObj = rgbaToRgba(rgba);
	return rgbObjBrightness(rgbaObj);
}

//hex color (String) to brightness
function hexBrightness(hex) {
	rgb = hexToRgb(hex);
	return rgbObjBrightness(rgb);
}

//rgb (Object) to brightness
function rgbObjBrightness(rgb) {
	return 0.299*rgb.r + 0.587*rgb.g + 0.114*rgb.b;
}

//from TimDown@stackoverflow.com
//Convert hex color (String) to rgb (Object)
function hexToRgb(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

//Convert rgba (String) to rgba (Object)
function rgbaToRgba(rgbaString) {
	var result = rgbaString.match(/\d+/g).map(Number);
	return result ? {
		r: result[0],
		g: result[1],
		b: result[2],
		a: result[3]
	} : null;
}

//Delete alpha value from rgba (String)
function noAplphaValue(rgbaString) {
	rgba = rgbaToRgba(rgbaString);
	return "rgb(" + rgba.r + ", " + rgba.g + ", " + rgba.b + ")";
}

function isResponseLegal() {
	return responseColor != "" && responseColor != null && responseColor != undefined;
}