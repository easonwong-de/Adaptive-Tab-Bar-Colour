const darkSchemeDetection = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Detects the current system colour scheme.
 *
 * @returns {"dark" | "light"} The current system colour scheme, either "dark"
 *   or "light".
 */
export function getSystemScheme() {
	return darkSchemeDetection?.matches ? "dark" : "light";
}

/**
 * Registers a listener function that triggers when the colour scheme changes.
 *
 * @param {Function} listener - The function to be called when a scheme change
 *   event occurs.
 */
export function addSchemeChangeListener(listener) {
	darkSchemeDetection?.addEventListener("change", listener);
	browser.browserSettings?.overrideContentColorScheme?.onChange?.addListener(
		listener,
	);
}

/**
 * Retrieves the preferred colour scheme.
 *
 * Retrieves the user's "web appearance" browser settings. If the setting is
 * explicitly `light` or `dark`, returns it.
 *
 * Otherwise, falls back to the operating system's current colour scheme based
 * on media query detection.
 *
 * This function should be called in background script to return the correct
 * result.
 *
 * @returns {Promise<"light" | "dark">} The current colour scheme, either
 *   `light` or `dark`.
 */
export async function getCurrentScheme() {
	try {
		const webAppearanceSetting =
			await browser.browserSettings?.overrideContentColorScheme?.get({});
		const webAppearance = webAppearanceSetting?.value;
		return webAppearance === "light" || webAppearance === "dark"
			? webAppearance
			: getSystemScheme();
	} catch {
		return getSystemScheme();
	}
}

/**
 * Registers a listener for tab and window change events.
 *
 * @param {Function} listener - The function to call on tab changes.
 */
export function addTabChangeListener(listener) {
	browser.tabs.onAttached.addListener(listener);
	browser.tabs.onActivated.addListener(listener);
	browser.tabs.onUpdated.addListener(listener, { properties: ["status"] });
	browser.windows.onFocusChanged.addListener(listener);
}

/**
 * Sends a message to a specific tab.
 *
 * @param {number} tabId - The ID of the tab to send the message to.
 * @param {object} message - The message to send.
 * @returns {Promise<any>} The response from the tab.
 */
export async function sendMessage(tabId, message) {
	return await browser.tabs.sendMessage(tabId, message);
}

/**
 * Registers a listener for runtime messages.
 *
 * @param {Function} listener - The function to call when a message is received.
 */
export function addMessageListener(listener) {
	browser.runtime.onMessage.addListener(listener);
}

/**
 * Updates the browser theme for a specific window.
 *
 * @param {number} windowId - The ID of the window to update.
 * @param {object} theme - The theme object to apply.
 */
export function updateBrowserTheme(windowId, theme) {
	browser.theme.update(windowId, theme);
}

/**
 * Inquires localised messages.
 *
 * @param {string} handle - A handle in _locales. If the handle is not found,
 *   returns `i18n <${handle}>`. If the localisation value is `__EMPTY__`,
 *   returns an empty string.
 * @returns {string} The localised message.
 */
export function i18n(handle) {
	const localisedMessage = browser.i18n.getMessage(handle);
	if (!localisedMessage) {
		return `i18n <${handle}>`;
	} else if (localisedMessage === "__EMPTY__") {
		return "";
	} else {
		return localisedMessage;
	}
}

/** Browser capability detection */
let _supportsThemeAPI = null;

/**
 * Checks if the browser supports the theme API.
 *
 * @returns {boolean} True if the browser supports the theme API, false
 *   otherwise.
 */
export function supportsThemeAPI() {
	if (_supportsThemeAPI === null) {
		_supportsThemeAPI =
			typeof browser.theme !== "undefined" &&
			typeof browser.theme.update === "function";
	}
	return _supportsThemeAPI;
}

/**
 * Retrieves the addon ID from a given URL by matching the UUID with registered
 * extensions.
 *
 * @param {string} url - The URL containing the UUID to match against extension
 *   host permissions.
 * @returns {Promise<string | undefined>} The addon ID if found, `undefined`
 *   otherwise.
 */
export async function getAddonId(url) {
	const uuid = url.split(/\/|\?/)[2];
	const addonList = await browser.management.getAll();
	let addonId;
	for (const addon of addonList) {
		if (addon.type !== "extension" || !addon.hostPermissions) {
			continue;
		} else if (addonId) {
			break;
		} else {
			for (const host of addon.hostPermissions) {
				if (
					host.startsWith("moz-extension:") &&
					uuid === host.split(/\/|\?/)[2]
				) {
					addonId = addon.id;
					break;
				}
			}
		}
	}
	return addonId;
}
