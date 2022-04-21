let color_scheme_light = document.getElementById("color_scheme_light");
let color_scheme_dark = document.getElementById("color_scheme_dark");
let color_scheme_no_light = document.getElementById("color_scheme_no_light");
let color_scheme_no_dark = document.getElementById("color_scheme_no_dark");
let custom = document.getElementById("custom");
let custom_options = document.getElementById("custom_options");
let light_color = document.getElementById("light_color");
let dark_color = document.getElementById("dark_color");
let custom_reset = document.getElementById("custom_reset");

browser.storage.local.get(function (pref){
	let scheme = pref.scheme;
	let force = pref.force;
	if (scheme == "light" && !force){
		color_scheme_light.checked = true;
		switchBodyToLight();
	}else if (scheme == "dark" && !force){
		color_scheme_dark.checked = true;
		switchBodyToDark();
	}else if (scheme == "dark" && force){
		color_scheme_no_light.checked = true;
		switchBodyToDark();
	}else if (scheme == "light" && force){
		color_scheme_no_dark.checked = true;
		switchBodyToLight();
	}
	let pref_custom = pref.custom;
	let pref_light_color = pref.light_color;
	let pref_dark_color = pref.dark_color;
	if (pref_custom){
		custom.checked = true;
		custom_options.hidden = false;
	}else{
		custom.checked = false;
		custom_options.hidden = true;
	}
	light_color.value = pref_light_color;
	dark_color.value = pref_dark_color;
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

custom.onclick = function() {
	if (custom.checked) {
		browser.storage.local.set({custom: true});
		custom_options.hidden = false;
		applySettings();
	}else{
		browser.storage.local.set({custom: false});
		custom_options.hidden = true;
		applySettings();
	}
};

light_color.addEventListener("change", function(event) {
	browser.storage.local.set({light_color: light_color.value});
	applySettings();
});

dark_color.addEventListener("change", function(event) {
	browser.storage.local.set({dark_color: dark_color.value});
	applySettings();
});

custom_reset.onclick = function() {
	browser.storage.local.set({
		light_color: "#FFFFFF",
		dark_color: "#1C1B22"
	});
	light_color.value = "#FFFFFF";
	dark_color.value = "#1C1B22";
	applySettings();
};

function applySettings() {
	chrome.runtime.sendMessage("apply_settings");
}

function switchBodyToLight() {
	body = document.getElementsByTagName("body")[0];
	body.classList.add("light");
	body.classList.remove("dark");
}

function switchBodyToDark() {
	body = document.getElementsByTagName("body")[0];
	body.classList.add("dark");
	body.classList.remove("light");
}