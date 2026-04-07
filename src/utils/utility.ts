import type {
	Scheme,
	Theme,
	MessageForBackground,
	MessageForPopup,
	MessageForTab,
	BackgroundMessageListener,
	PopupMessageListener,
	TabMessageListener,
} from "./types.js";

/** Match media for dark mode detection. */
const darkSchemeDetection = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Detects the system colour scheme.
 *
 * @returns {"dark" | "light"} The current system colour scheme.
 */
export function getSystemScheme(): Scheme {
	return darkSchemeDetection?.matches ? "dark" : "light";
}

/**
 * Registers a listener for colour scheme changes.
 *
 * @param {() => void} listener - The function to call on scheme change.
 */
export function addSchemeChangeListener(listener: () => void): void {
	darkSchemeDetection?.addEventListener("change", listener);
	(
		browser as any
	).browserSettings?.overrideContentColorScheme?.onChange?.addListener(
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
export async function getCurrentScheme(): Promise<Scheme> {
	try {
		const webAppearanceSetting = await (
			browser as any
		).browserSettings?.overrideContentColorScheme?.get({});
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
 * @param {() => void} listener - The function to call on tab changes.
 */
export function addTabChangeListener(listener: () => void): void {
	browser.tabs.onAttached.addListener(listener);
	browser.tabs.onActivated.addListener(listener);
	browser.tabs.onUpdated.addListener(listener, { properties: ["status"] });
	browser.windows.onFocusChanged.addListener(listener);
	browser.windows.onBoundsChanged?.addListener(listener);
}

/**
 * Resolves the target window id from a sender tab or the last focused window.
 *
 * @async
 * @param {Browser.tabs.Tab | undefined} tab - Sender tab, if available.
 * @returns {Promise<number | undefined>} Resolved window id.
 */
export async function getCurrentWindowId(
	tab?: Browser.tabs.Tab,
): Promise<number | undefined> {
	return tab?.windowId ?? (await browser.windows.getLastFocused()).id;
}

/**
 * Retrieves all active and fully loaded tabs.
 *
 * @async
 * @returns {Promise<Browser.tabs.Tab[]>} List of active and complete tabs.
 */
export async function getActiveTabList(): Promise<Browser.tabs.Tab[]> {
	return await browser.tabs.query({
		active: true,
		status: "complete",
	});
}

/** Browser capability detection. */
let _supportsThemeAPI: boolean;

/**
 * Checks if the browser supports the theme API.
 *
 * @returns {boolean} `true` if supported.
 */
export function supportsThemeAPI(): boolean {
	if (_supportsThemeAPI === undefined) {
		const runtimeBrowser = (
			globalThis as {
				browser?: {
					theme?: {
						update?: (...args: unknown[]) => unknown;
					};
				};
			}
		).browser;
		_supportsThemeAPI = typeof runtimeBrowser?.theme?.update === "function";
	}
	return _supportsThemeAPI;
}

/**
 * Updates the browser theme for a specific window.
 *
 * @param {number} windowId - The ID of the window.
 * @param {Theme} theme - The theme object to apply.
 */
export function updateBrowserTheme(windowId: number, theme: Theme): void {
	browser.theme?.update(windowId, theme);
}

/**
 * Retrieves the add-on ID from a given URL.
 *
 * @async
 * @param {string} url - The URL containing the UUID.
 * @returns {Promise<string | undefined>} The add-on ID if found.
 */
export async function getAddonId(url: string): Promise<string | undefined> {
	const addonList = await browser.management.getAll();
	for (const addon of addonList) {
		if (addon.type !== "extension") continue;
		for (const host of addon.hostPermissions) {
			if (
				host.startsWith("moz-extension:") &&
				url.split(/\/|\?/)[2] === host.split(/\/|\?/)[2]
			) {
				return addon.id;
			}
		}
	}
}

/**
 * Retrieves the name of an add-on.
 *
 * @async
 * @param {string} addonId - The ID of the add-on.
 * @returns {Promise<string>} The name of the add-on.
 */
export async function getAddonName(addonId: string): Promise<string> {
	try {
		const info = await browser.management.get(addonId);
		return info.name;
	} catch (error) {
		return i18n.t("addonNotFound");
	}
}

/**
 * Sends a message to the background script.
 *
 * @async
 * @param {MessageForBackground} message - The message object.
 * @returns {Promise<T>} The response from the background script.
 */
export async function sendMessageToBackground<T = unknown>(
	message: MessageForBackground,
): Promise<T> {
	return await browser.runtime.sendMessage(message);
}

/**
 * Sends a message to popup listeners.
 *
 * @async
 * @param {MessageForPopup} message - The message object.
 * @returns {Promise<T>} The response from the popup.
 */
export async function sendMessageToPopup<T = unknown>(
	message: MessageForPopup,
): Promise<T> {
	return await browser.runtime.sendMessage(message).catch(() => {});
}

/**
 * Sends a message to a specific tab.
 *
 * @async
 * @param {number} tabId - The ID of the tab.
 * @param {MessageForTab} message - The message object.
 * @returns {Promise<T>} The response from the tab.
 */
export async function sendMessageToTab<T = unknown>(
	tabId: number,
	message: MessageForTab,
): Promise<T> {
	return await browser.tabs.sendMessage(tabId, message);
}

/**
 * Registers a runtime message listener.
 *
 * @param {BackgroundMessageListener
 * 	| PopupMessageListener
 * 	| TabMessageListener} listener
 *   - The listener to register.
 */
export function addMessageListener(
	listener:
		| BackgroundMessageListener
		| PopupMessageListener
		| TabMessageListener,
): void {
	browser.runtime.onMessage.addListener(listener);
}

/**
 * Removes a runtime message listener.
 *
 * @param {BackgroundMessageListener
 * 	| PopupMessageListener
 * 	| TabMessageListener} listener
 *   - The listener to remove.
 */
export function removeMessageListener(
	listener:
		| BackgroundMessageListener
		| PopupMessageListener
		| TabMessageListener,
): void {
	browser.runtime.onMessage.removeListener(listener);
}

/**
 * Clamps a number between a minimum and maximum value.
 *
 * @param {number} min - The minimum value.
 * @param {number} num - The number to clamp.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value.
 */
export function clamp(min: number, num: number, max: number): number {
	return Math.max(min, Math.min(max, num));
}
