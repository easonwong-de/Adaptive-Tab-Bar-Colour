import type {
	BackgroundMessageListener,
	MessageForBackground,
	MessageForPopup,
	MessageForTab,
	PopupMessageListener,
	Scheme,
	TabMessageListener,
	Theme,
} from "./types";

/** Match media for dark mode detection. */
const darkSchemeDetection = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Detects the system colour scheme.
 *
 * @returns {Scheme} The current system colour scheme.
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
 * @returns {Promise<Scheme>} The current colour scheme.
 */
export async function getCurrentScheme(): Promise<Scheme> {
	try {
		const webAppearanceSetting =
			await browser.browserSettings?.overrideContentColorScheme?.get({});
		const webAppearance = webAppearanceSetting?.value;
		return webAppearance === "light" || webAppearance === "dark"
			? (webAppearance as Scheme)
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
export async function getWindowId(
	tab?: Browser.tabs.Tab,
): Promise<number | undefined> {
	return tab?.windowId ?? (await browser.windows.getLastFocused()).id;
}

/**
 * Checks whether the tab's window is incognito.
 *
 * @async
 * @param {number} windowId - Window ID.
 * @returns {Promise<boolean>} `true` if the window is incognito.
 */
export async function isWindowIncognito(windowId: number): Promise<boolean> {
	try {
		return (await browser.windows.get(windowId)).incognito;
	} catch {
		return false;
	}
}

/**
 * Retrieves all active and fully loaded tabs.
 *
 * @async
 * @returns {Promise<Browser.tabs.Tab[]>} List of active and complete tabs.
 */
export async function getActiveTabList(): Promise<Browser.tabs.Tab[]> {
	return await browser.tabs.query({ active: true, status: "complete" });
}

/**
 * Checks if the browser supports the theme API.
 *
 * @returns {boolean} `true` if supported.
 */
export function supportsThemeAPI(): boolean {
	const runtimeBrowser = (
		globalThis as {
			browser?: {
				theme?: { update?: (windowId: number, theme: Theme) => void };
			};
		}
	).browser;
	return typeof runtimeBrowser?.theme?.update === "function";
}

/**
 * Updates the browser theme for a specific window.
 *
 * @param {number} windowId - The ID of the window.
 * @param {Theme} theme - The theme object to apply.
 * @returns {Promise<boolean>} `true` if the theme update succeeds.
 */
export async function updateBrowserTheme(
	windowId: number,
	theme: Theme,
): Promise<boolean> {
	try {
		await browser.theme?.update(windowId, theme);
		return true;
	} catch {
		console.error(
			"Failed to update browser theme. Theme API might not be supported.",
		);
		return false;
	}
}

/**
 * Resolves the extension ID from a `moz-extension:` URL.
 *
 * @param {string} url - The URL to resolve.
 * @returns {Promise<string | undefined>} Matching extension ID, if found.
 */
export async function getWebExtId(url: string): Promise<string | undefined> {
	if (!url.startsWith("moz-extension:")) return;
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
 * Resolves the extension name from an add-on ID.
 *
 * @param {string} id - The extension add-on ID.
 * @returns {Promise<string | undefined>} Extension name, if found.
 */
export async function getWebExtName(id: string): Promise<string | undefined> {
	try {
		const addon = await browser.management.get(id);
		if (addon.type === "extension") return addon.name;
	} catch {}
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
