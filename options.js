let force_mode_caption = document.getElementById("force_mode_caption");
let force_mode = document.getElementById("force_mode");
let color_scheme_no_light = document.getElementById("color_scheme_no_light");
let color_scheme_no_dark = document.getElementById("color_scheme_no_dark");
let custom = document.getElementById("custom");
let custom_options = document.getElementById("custom_options");
let light_color = document.getElementById("light_color");
let dark_color = document.getElementById("dark_color");
let custom_reset = document.getElementById("custom_reset");

//browser.storage.local.set({force: true}); //v1.3.1 temporary fix

browser.storage.local.get(function (pref){
	let scheme = pref.scheme;
	let force = pref.force;
	if (force){
		force_mode.checked = false;
	}else{
		force_mode.checked = true;
	}
	if (scheme == "dark"){
		switchBodyToDark();
	}else{
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

color_scheme_no_light.addEventListener("input", function(event) {
	if (color_scheme_no_light.checked) {
		browser.storage.local.set({scheme: "dark"});
		browser.browserSettings.overrideContentColorScheme.set({value: "dark"});
		switchBodyToDark();
		applySettings();
	}
});

color_scheme_no_dark.addEventListener("input", function(event) {
	if (color_scheme_no_dark.checked) {
		browser.storage.local.set({scheme: "light"});
		browser.browserSettings.overrideContentColorScheme.set({value: "light"});
		switchBodyToLight();
		applySettings();
	}
});

force_mode.onclick = function() {
	if (force_mode.checked) {
		browser.storage.local.set({force: false});
		applySettings();
	}else{
		browser.storage.local.set({force: true});
		applySettings();
	}
};

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
	color_scheme_no_light.checked = false;
	color_scheme_no_dark.checked = true;
	force_mode_caption.innerHTML = "Allow dark tab bar";
}

function switchBodyToDark() {
	body = document.getElementsByTagName("body")[0];
	body.classList.add("dark");
	body.classList.remove("light");
	color_scheme_no_light.checked = true;
	color_scheme_no_dark.checked = false;
	force_mode_caption.innerHTML = "Allow light tab bar";
}