
response = "";

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message == 'background_color'){
			headerTag = document.querySelector('meta[name="theme-color"]'); //Get theme-color defined by the website html
			if (headerTag == null){ //If there's no existing defined theme color
				response = getComputedColor();
			}else{
				if (tooBright(headerTag.content)){ //Theme color is too bright
					response = getComputedColor();
				}else{
					response = headerTag.content;
				}
			}
			sendResponse({value: response});
		}
	}
);

//Get computed background color, if it's too bright, return default color
function getComputedColor() {
	rgbString = window.getComputedStyle(document.body,null).getPropertyValue('background-color');
	if (tooBright(rgbString)){
		return "rgb(28, 27, 34)";
	}else{
		return rgbString;
	}
}

//Check if the color is too bright
function tooBright(string) {
	if (string.startsWith("rgb")){
		return rgbBrightness(rgbToRgb(string)) > 120;
	}else{
		return hexBrightness(string) > 120;
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

//Convert rgb (String) to rgb (Object)
function rgbToRgb(rgbString) {
	var result = rgbString.match(/\d+/g).map(Number);
	return result ? {
			r: result[0],
			g: result[1],
			b: result[2],
			a: result[3]
	} : null;
}