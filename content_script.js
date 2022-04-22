//Content script tells background.js what color to use
//and in which color should the text in tab bar be

var responseColor = "";
var darkMode = false;

const reservedColor = {
	"light": {
		"github.com": "rgb(36, 41, 47)"
	},
	"dark": {
		"open.spotify.com": "rgb(0, 0, 0)",
		//"www.youtube.com": "rgb(32, 32, 32)",
		"www.twitch.tv": "rgb(24, 24, 27)",
		"github.com": "rgb(22, 27, 34)"
	}
}

//Find the best color
function findColor() {
	browser.storage.local.get(function (pref) {
		let key = "";
		let scheme = pref.scheme;
		let reversed_scheme = "light";
		if (scheme == "light") reversed_scheme = "dark";
		host = document.location.host; // e.g. key can be "www.irgendwas.com"
		if (reservedColor[scheme][host] != null){ //For prefered scheme there's a reserved color
			responseColor = reservedColor[scheme][host];
			darkMode = !tooBright(responseColor);
		}else if (reservedColor[reversed_scheme][host] != null){ //Site has reserved color in the other mode
			responseColor = reservedColor[reversed_scheme][host];
			darkMode = !tooBright(responseColor);
		}else{
			//No reserved color found, use noemal way to find a color
			findColorUnreserved();
		}
		//Sent color to background.js
		port = browser.runtime.connect();
		if (!document.hidden) port.postMessage({color: responseColor, darkMode: darkMode});
	});
}

//When there isn't a reserved color for the website
function findColorUnreserved() {
	//dark&light mode decides the color of the tab text, button icons etc.
	//theme-color is provided by website: getThemeColor()
	//background is computed: getComputedColor()
	//A: no theme-color exists, background is dark => returns background & in dark mode
	//B: no theme-color exists, background is bright => returns background & in light mode
	//C: theme-color is bright, background is dark => returns background & in dark mode
	//D: theme-color is dark, background is bright => returns theme-color & in dark mode
	//E: both are bright => returns theme-color & in light mode
	//F: both are dark => returns theme-color & in dark mode
	if (getThemeColor() == null){ //A,B
		responseColor = getComputedColor();
		//console.log("theme-color not found. bgcolor: " + responseColor + ", too bright: " + tooBright(responseColor));
		if (tooBright(responseColor)){ //B
			darkMode = false;
		}else{ //A
			darkMode = true;
		}
	}else{ //C,D,E,F
		let themeColor = "";
		let backgroundColor = "";
		themeColor = getThemeColor();
		backgroundColor = getComputedColor();
		//console.log("theme-color: " + themeColor + ", too bright: " + tooBright(themeColor));
		//console.log("bgcolor: " + backgroundColor + ", too bright: " + tooBright(backgroundColor));
		if (tooBright(themeColor) && !tooBright(backgroundColor)){ //C
			responseColor = backgroundColor;
			darkMode = true;
		}else if (!tooBright(themeColor) && tooBright(backgroundColor)){ //D
			responseColor = themeColor;
			darkMode = true;
		}else if (tooBright(themeColor) && tooBright(backgroundColor)){ //E
			responseColor = themeColor;
			darkMode = false;
		}else if (!tooBright(themeColor) && !tooBright(backgroundColor)){ //F
			responseColor = themeColor;
			darkMode = true;
		}
	}
	//Make sure there will be no alpha value transmitted to background.js
	if (responseColor.startsWith("rgba")) responseColor = noAplphaValue(responseColor);
}

findColor();

//Remind background.js of the color
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message == 'remind_me' && responseColor != ""){
			sendResponse({color: responseColor, darkMode: darkMode}); //Sends cached color to background.js
			findColor(); //In case preferences are changed
		}
	}
);

//Get computed background color e.g. "rgb(30, 30, 30)"
function getComputedColor() {
	color = EmiliosHeader();
	if (color == null){
		color = window.getComputedStyle(document.body,null).getPropertyValue('background-color');
		if (color == "rgba(0, 0, 0, 0)") color = "rgb(255, 255, 255)"; //Sometimes computed color lies
	}
	return color;
}

//Suggested by emilio@crisal.io
//Huge thanks and respect to Emilio Cobos Álvarez
function EmiliosHeader(){
	let color = null;
	for (let el = document.elementFromPoint(window.innerWidth / 2, 1); el; el = el.parentElement) {
	let temp_color = getComputedStyle(el).backgroundColor;
	if (temp_color != "rgba(0, 0, 0, 0)" && temp_color != "rgb(255, 255, 255)" && temp_color != "rgb(0, 0, 0)")
		color = temp_color;
		//console.log("Emilio: " + color);
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

//Check if the color is too bright for dark mode
function tooBright(string) {
	if (string.startsWith("#")){
		return hexBrightness(string) > 120;
	}else{
		return rgbBrightness(string) > 120;
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
