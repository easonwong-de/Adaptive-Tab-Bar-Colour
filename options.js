let color_scheme_light = document.getElementById("color_scheme_light");
let color_scheme_dark = document.getElementById("color_scheme_dark");

browser.storage.local.get("scheme", function (pref) {
	let scheme = pref.scheme;
	if (scheme == "light"){
		color_scheme_light.checked = true;
		document.getElementsByTagName("body")[0].className = "light";
	}else if (scheme == "dark"){
		color_scheme_dark.checked = true;
		document.getElementsByTagName("body")[0].className = "dark";
	}
});

color_scheme_light.addEventListener("input", function(event) {
	if (color_scheme_light.checked) {
		browser.storage.local.set({scheme: "light"});
		document.getElementsByTagName("body")[0].className = "light";
		applySettings();
	}
});

color_scheme_dark.addEventListener("input", function(event) {
	if (color_scheme_dark.checked) {
		browser.storage.local.set({scheme: "dark"});
		document.getElementsByTagName("body")[0].className = "dark";
		applySettings();
	}
});

function applySettings() {
	chrome.runtime.sendMessage("apply_settings");
}
