let color_scheme_light = document.getElementById("color_scheme_light");
let color_scheme_dark = document.getElementById("color_scheme_dark");
let color_scheme_no_light = document.getElementById("color_scheme_no_light");
let color_scheme_no_dark = document.getElementById("color_scheme_no_dark");

browser.storage.local.get(function (pref) {
	let scheme = pref.scheme;
	let force = pref.force;
	if (scheme == "light" && !force){
		color_scheme_light.checked = true;
		document.getElementsByTagName("body")[0].className = "light";
	}else if (scheme == "dark" && !force){
		color_scheme_dark.checked = true;
		document.getElementsByTagName("body")[0].className = "dark";
	}else if (scheme == "dark" && force){
		color_scheme_no_light.checked = true;
		document.getElementsByTagName("body")[0].className = "dark";
	}else if (scheme == "light" && force){
		color_scheme_no_dark.checked = true;
		document.getElementsByTagName("body")[0].className = "light";
	}
});

color_scheme_light.addEventListener("input", function(event) {
	if (color_scheme_light.checked) {
		browser.storage.local.set({scheme: "light", force: false});
		document.getElementsByTagName("body")[0].className = "light";
		applySettings();
	}
});

color_scheme_dark.addEventListener("input", function(event) {
	if (color_scheme_dark.checked) {
		browser.storage.local.set({scheme: "dark", force: false});
		document.getElementsByTagName("body")[0].className = "dark";
		applySettings();
	}
});

color_scheme_no_light.addEventListener("input", function(event) {
	if (color_scheme_no_light.checked) {
		browser.storage.local.set({scheme: "dark", force: true});
		document.getElementsByTagName("body")[0].className = "dark";
		applySettings();
	}
});

color_scheme_no_dark.addEventListener("input", function(event) {
	if (color_scheme_no_dark.checked) {
		browser.storage.local.set({scheme: "light", force: true});
		document.getElementsByTagName("body")[0].className = "light";
		applySettings();
	}
});

function applySettings() {
	chrome.runtime.sendMessage("apply_settings");
}
