"use strict";

/**
 * @returns Firefox version. 0 if cannot be found.
 */
export function checkVersion() {
	let userAgent = navigator.userAgent;
	let version = 0;
	let ind = userAgent.lastIndexOf("Firefox");
	if (ind !== -1) version = userAgent.substring(ind + 8);
	return version;
}

const darkSchemeDetection = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Registers a listener function that triggers when the colour scheme changes.
 *
 * @param {Function} listener The function to be called when a scheme change event occurs.
 */
export function onSchemeChanged(listener) {
	darkSchemeDetection?.addEventListener("change", listener);
}

/**
 * Retrieves the preferred colour scheme.
 *
 * Retrieves the user's "web appearance" browser settings. If the setting is explicitly `light` or `dark`, returns it. Otherwise, falls back to the operating system's current colour scheme based on media query detection.
 *
 * This function should be called in background script to return the correct result.
 *
 * @returns {Promise<"light" | "dark">} The current colour scheme, either `light` or `dark`.
 */
export async function getCurrentScheme() {
	const webAppearanceSetting = await browser.browserSettings.overrideContentColorScheme.get({});
	const scheme = webAppearanceSetting.value;
	if (scheme === "light" || scheme === "dark") {
		return scheme;
	} else {
		return darkSchemeDetection?.matches ? "dark" : "light";
	}
}

/**
 * Inquires localised messages.
 *
 * If no localised string is found, returns `Localisation missing: <handle>`
 *
 * @param {string} handle A handle in _locales.
 */
export function msg(handle) {
	const localisedMessage = browser.i18n.getMessage(handle);
	if (!localisedMessage) {
		return `Localisation missing: <${handle}>`;
	} else if (localisedMessage === "__EMPTY__") {
		return "";
	} else {
		return localisedMessage;
	}
}
