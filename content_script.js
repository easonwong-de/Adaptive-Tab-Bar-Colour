//Content script tells background.js what color to use
//and in which color should the text in tab bar be

themeColor = "";
backgroundColor = "";

responseColor = "";
darkMode = true;

//Find the best color
function findColor() {
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
		console.log("theme-color not found. bgcolor: " + responseColor + ", too bright: " + tooBright(responseColor));
		if (tooBright(responseColor)){ //B
			darkMode = false;
		}else{ //A
			darkMode = true;
		}
	}else{ //C,D,E,F
		themeColor = getThemeColor();
		backgroundColor = getComputedColor();
		console.log("theme-color: " + themeColor + ", too bright: " + tooBright(themeColor));
		console.log("bgcolor: " + backgroundColor + ", too bright: " + tooBright(backgroundColor));
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

//Sent color to background.js once as soon as content script is loaded
findColor();
let port = browser.runtime.connect({name:"port_cs"});
port.postMessage({color: responseColor, darkMode: darkMode});

//Remind background.js of the color
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message == 'remind_me'){
			sendResponse({color: responseColor, darkMode: darkMode}); //Sends stored color to background.js
			findColor(); //In case preferences are changed
			sendResponse({color: responseColor, darkMode: darkMode});
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
		console.log("Emilio: " + color);
	}
	return color;
}

//Get provided theme-color e.g. "#ffffff", "rgba(30, 30, 30, 0.9)"
function getThemeColor() {
	headerTag = document.querySelector('meta[name="theme-color"]'); //Get theme-color defined by the website html
	if (headerTag == null){
		/*MicrosoftNavbar = document.querySelector('.o365sx-navbar');
		if (MicrosoftNavbar != null){ //If it's a Microsoft website, which hide its theme-color for some reason
			return getComputedStyle(MicrosoftNavbar).backgroundColor;
		}else{*/
			return null;
		//}
	}else{
		return headerTag.content;
	}
}

//Check if the color is too bright for dark mode
function tooBright(string) {
	if (string.startsWith("#")){
		return hexBrightness(string) > 120;
	}else{
		return rgbBrightness(rgbaToRgba(string)) > 120;
	}
}

//rgb (Object) to brightness
function rgbBrightness(rgb) {
	return 0.299*rgb.r + 0.587*rgb.g + 0.114*rgb.b;
}

//hex color (String) to brightness
function hexBrightness(hex) {
	rgb = hexToRgb(hex);
	return rgbBrightness(rgb);
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
