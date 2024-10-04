import { default_reservedColour_webPage, recommendedColour_addon, protectedDomain, checkVersion } from "./shared.js";

// Localisation
document.addEventListener("DOMContentLoaded", function () {
	document.querySelectorAll("[data-text]").forEach((element) => {
		element.textContent = msg(element.dataset.text);
	});
	document.querySelectorAll("[data-title]").forEach((element) => {
		element.title = msg(element.dataset.title);
	});
});
