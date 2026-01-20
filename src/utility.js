/** Match media for dark mode detection */
const darkSchemeDetection = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Detects the system colour scheme.
 *
 * @returns {"dark" | "light"} The current system colour scheme.
 */
export function getSystemScheme() {
	return darkSchemeDetection?.matches ? "dark" : "light";
}

/**
 * Registers a listener for colour scheme changes.
 *
 * @param {Function} listener - The function to call on scheme change.
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
 * Falls back to the system scheme if no browser preference is set.
 *
 * @async
 * @returns {Promise<"light" | "dark">} The current colour scheme.
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
 * @async
 * @param {number} tabId - The ID of the tab.
 * @param {object} message - The message object.
 * @returns {Promise<any>} The response from the tab.
 */
export async function sendMessage(tabId, message) {
	return await browser.tabs.sendMessage(tabId, message);
}

/**
 * Registers a listener for runtime messages.
 *
 * @param {Function} listener - The function to call on message.
 */
export function addMessageListener(listener) {
	browser.runtime.onMessage.addListener(listener);
}

/**
 * Updates the browser theme for a specific window.
 *
 * @param {number} windowId - The ID of the window.
 * @param {object} theme - The theme object to apply.
 */
export function updateBrowserTheme(windowId, theme) {
	browser.theme.update(windowId, theme);
}

/**
 * Retrieves all active and fully loaded tabs.
 *
 * @async
 * @returns {Promise<tabs.Tab[]>} List of active and complete tabs.
 */
export async function getActiveTabList() {
	return await browser.tabs.query({
		active: true,
		status: "complete",
	});
}

/**
 * Retrieves a localised message.
 *
 * If the handle is not found, returns `i18n <${handle}>`. If the localisation
 * value is `__EMPTY__`, returns an empty string.
 *
 * @param {string} handle - The locale handle.
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
 * @returns {boolean} `true` if supported.
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
 * Retrieves the add-on ID from a given URL.
 *
 * @async
 * @param {string} url - The URL containing the UUID.
 * @returns {Promise<string | undefined>} The add-on ID if found.
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

/**
 * Clamps a number between a minimum and maximum value.
 *
 * @param {number} min - The minimum value.
 * @param {number} num - The number to clamp.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value.
 */
export function clamp(min, num, max) {
	return Math.max(min, Math.min(max, num));
}
