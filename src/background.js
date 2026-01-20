/*
 * System colour scheme:
 * The colour scheme of the operating system, usually light or dark.
 *
 * Browser colour scheme:
 * The "website appearance" settings of Firefox, which can be light, dark, or auto.
 *
 * `cashe.scheme`:
 * Derived from system and browser colour scheme and decides whether the light theme or dark theme is preferred.
 *
 * `pref.allowDarkLight`:
 * A setting that decides if a light theme is allowed to be used when current.scheme is dark, or vice versa.
 *
 * meta tag theme:
 * A colour defined with a meta tag by some websites, usually static.
 * It is often more related to the branding than the actual appearance of the website.
 *
 * Theme:
 * An object that defines the colour of the Firefox UI.
 */

import preference from "./preference.js";
import colour from "./colour.js";
import { aboutPageColour, mozillaPageColour } from "./constants.js";
import {
	addMessageListener,
	addSchemeChangeListener,
	addTabChangeListener,
	getActiveTabList,
	getAddonId,
	getCurrentScheme,
	getSystemScheme,
	sendMessage,
	updateBrowserTheme,
} from "./utility.js";

/** Preference */
const pref = new preference();

/** Lookup table for colour codes */
const colourCode = Object.freeze({
	HOME: {
		get light() {
			return new colour(pref.homeBackground_light);
		},
		get dark() {
			return new colour(pref.homeBackground_dark);
		},
	},
	FALLBACK: {
		get light() {
			return new colour(pref.fallbackColour_light);
		},
		get dark() {
			return new colour(pref.fallbackColour_dark);
		},
	},
	PLAINTEXT: {
		light: new colour().rgba(255, 255, 255, 1),
		dark: new colour().rgba(28, 27, 34, 1),
	},
	SYSTEM: {
		light: new colour().rgba(255, 255, 255, 1),
		dark: new colour().rgba(30, 30, 30, 1),
	},
	ADDON: {
		light: new colour().rgba(236, 236, 236, 1),
		dark: new colour().rgba(50, 50, 50, 1),
	},
	PDFVIEWER: {
		light: new colour().rgba(249, 249, 250, 1),
		dark: new colour().rgba(56, 56, 61, 1),
	},
	IMAGEVIEWER: { light: undefined, dark: new colour().rgba(33, 33, 33, 1) },
	JSONVIEWER: {
		get light() {
			return getSystemScheme() === "light"
				? new colour().rgba(249, 249, 250, 1)
				: undefined;
		},
		get dark() {
			return getSystemScheme() === "dark"
				? new colour().rgba(12, 12, 13, 1)
				: undefined;
		},
	},
	DEFAULT: {
		light: new colour().rgba(255, 255, 255, 1),
		dark: new colour().rgba(28, 27, 34, 1),
	},
});

/** Cache */
const cache = {
	/** `windowId: { colour, reason, info, corrected }` */
	meta: {},
	/** `windowId: { headerType, header, type, value }` */
	policy: {},
	/** `light` or `dark` */
	scheme: "light",
	/** The reversed colour theme. */
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	/** Update `scheme` & clear `info` and `policy`. */
	async clear() {
		this.scheme = await getCurrentScheme();
		this.meta = {};
		this.policy = {};
	},
};

/**
 * Handles incoming messages based on their header.
 *
 * @async
 * @param {object} message - The message object.
 * @param {runtime.MessageSender} sender - The message sender.
 * @returns {Promise<any>} Response data or acknowledgment.
 */
async function handleMessage(message, sender) {
	const tab = sender.tab;
	const header = message.header;
	switch (header) {
		case "SCRIPT_READY":
			updateTab(tab);
			break;
		case "UPDATE_COLOUR":
			const tabMeta = parseTabColour(
				cache.policy[tab.windowId],
				message.colour,
			);
			cache.meta[tab.windowId] = tabMeta;
			setFrameColour(tab, tabMeta.colour);
			break;
		case "SCHEME_REQUEST":
			return await getCurrentScheme();
		case "META_REQUEST":
			return cache.meta[message.windowId];
		default:
			await run();
	}
	return true;
}

/**
 * Triggers colour update for all active tabs.
 *
 * @async
 */
async function run() {
	await cache.clear();
	(await getActiveTabList()).forEach(updateTab);
}

/**
 * Updates the colour for a tab and caches its meta information.
 *
 * @async
 * @param {tabs.Tab} tab - The tab to update.
 */
async function updateTab(tab) {
	const windowId = tab.windowId;
	const policy = pref.getPolicy(tab.url).policy;
	cache.policy[windowId] = policy;
	const tabMeta = await getTabMeta(tab);
	cache.meta[windowId] = tabMeta;
	setFrameColour(tab, tabMeta.colour);
}

/**
 * Determines the appropriate colour meta for a tab.
 *
 * @async
 * @param {tabs.Tab} tab - The tab to extract colour from.
 * @returns {Promise<{ colour: colour; reason: string; info?: string }>} Tab
 *   metadata.
 */
async function getTabMeta(tab) {
	const policy = cache.policy[tab.windowId];
	if (policy?.headerType === "URL" && policy?.type === "COLOUR") {
		return {
			colour: new colour(policy.value),
			reason: "COLOUR_SPECIFIED",
		};
	} else {
		try {
			const tabColour = await sendMessage(tab.id, {
				header: "GET_COLOUR",
				active: policy?.type !== "COLOUR",
				dynamic: pref.dynamic,
				query:
					policy?.type === "QUERY_SELECTOR"
						? policy.value
						: undefined,
			});
			return parseTabColour(policy, tabColour);
		} catch (error) {
			console.warn("Failed to connect to", tab.url);
			return await getProtectedPageMeta(tab);
		}
	}
}

/**
 * Parses tab colour data based on policy.
 *
 * @param {object} policy - The policy object.
 * @param {object} colourData - The tab colour data.
 * @param {object} colourData.theme - Theme colour data.
 * @param {Array} colourData.page - Page element colour data.
 * @param {object} colourData.query - Query selector result.
 * @returns {{ colour: colour; reason: string; info?: string }} Parsed metadata.
 */
function parseTabColour(policy, { theme, page, query }) {
	const parseThemeColour = () => new colour(theme[cache.scheme], false);
	const parsePageColour = () => {
		let pageColour = new colour();
		for (const element of page) {
			const opacity = parseFloat(element.opacity);
			if (isNaN(opacity)) continue;
			pageColour = pageColour.mix(
				new colour(element.colour, false).opacity(opacity),
			);
			if (pageColour.isOpaque()) break;
		}
		return pageColour.isOpaque()
			? pageColour
			: pageColour.mix(colourCode.FALLBACK[cache.scheme]);
	};
	const parseQueryColour = () => new colour(query?.colour);
	switch (policy?.type) {
		case "THEME_COLOUR": {
			const themeColour = parseThemeColour();
			if (policy.value && themeColour.isOpaque()) {
				return {
					colour: themeColour,
					reason: "THEME_USED",
				};
			}
			return {
				colour: parsePageColour(),
				reason: policy.value
					? "THEME_MISSING"
					: themeColour.isOpaque()
						? "THEME_IGNORED"
						: "COLOUR_PICKED",
			};
		}
		case "QUERY_SELECTOR": {
			const queryColour = parseQueryColour();
			return queryColour.isOpaque()
				? {
						colour: queryColour,
						reason: "QS_USED",
						info: policy.value || "🕳️",
					}
				: {
						colour: parsePageColour(),
						reason: "QS_FAILED",
						info: policy.value || "🕳️",
					};
		}
		default:
			return { colour: parsePageColour(), reason: "COLOUR_PICKED" };
	}
}

/**
 * Determines the colour for a protected page.
 *
 * @async
 * @param {tabs.Tab} tab - The tab.
 * @returns {Promise<{ colour: colour; reason: string; info?: string }>}
 *   Metadata.
 */
async function getProtectedPageMeta(tab) {
	const url = new URL(tab.url);
	if (
		["about:firefoxview", "about:home", "about:newtab"].some((href) =>
			url.href.startsWith(href),
		)
	) {
		return { colour: new colour("HOME"), reason: "HOME_PAGE" };
	} else if (
		url.href === "about:blank" &&
		tab.title.startsWith("about:") &&
		tab.title.endsWith("profile")
	) {
		return getAboutPageMeta(tab.title.slice(6));
	} else if (url.protocol === "about:") {
		return getAboutPageMeta(url.pathname);
	} else if (url.protocol === "moz-extension:") {
		return await getAddonPageMeta(url.href);
	} else if (url.hostname in mozillaPageColour) {
		return getMozillaPageMeta(url.hostname);
	} else if (url.protocol === "view-source:") {
		return {
			colour: new colour("PLAINTEXT"),
			reason: "PROTECTED_PAGE",
		};
	} else if (["chrome:", "resource:", "jar:file:"].includes(url.protocol)) {
		if (
			[".txt", ".css", ".jsm", ".js"].some((extention) =>
				url.href.endsWith(extention),
			)
		) {
			return {
				colour: new colour("PLAINTEXT"),
				reason: "PROTECTED_PAGE",
			};
		} else if (
			[".png", ".jpg"].some((extention) => url.href.endsWith(extention))
		) {
			return {
				colour: new colour("IMAGEVIEWER"),
				reason: "PROTECTED_PAGE",
			};
		} else {
			return {
				colour: new colour("SYSTEM"),
				reason: "PROTECTED_PAGE",
			};
		}
	} else if (url.href.startsWith("data:image")) {
		return {
			colour: new colour("IMAGEVIEWER"),
			reason: "IMAGE_VIEWER",
		};
	} else if (url.href.endsWith(".pdf") || tab.title.endsWith(".pdf")) {
		return {
			colour: new colour("PDFVIEWER"),
			reason: "PDF_VIEWER",
		};
	} else if (url.href.endsWith(".json") || tab.title.endsWith(".json")) {
		return {
			colour: new colour("JSONVIEWER"),
			reason: "JSON_VIEWER",
		};
	} else if (tab.favIconUrl?.startsWith("chrome:")) {
		return {
			colour: new colour("DEFAULT"),
			reason: "PROTECTED_PAGE",
		};
	} else if (url.href.match(new RegExp(`https?:\/\/${tab.title}$`, "i"))) {
		return {
			colour: new colour("PLAINTEXT"),
			reason: "TEXT_VIEWER",
		};
	} else {
		return {
			colour: new colour("FALLBACK"),
			reason: "FALLBACK_COLOUR",
		};
	}
}

/**
 * Gets the colour for an about: page.
 *
 * @param {string} pathname - The pathname of the page.
 * @returns {{ colour: colour; reason: string }} Metadata.
 */
function getAboutPageMeta(pathname) {
	if (aboutPageColour[pathname]?.[cache.scheme]) {
		return {
			colour: new colour(aboutPageColour[pathname][cache.scheme]),
			reason: "PROTECTED_PAGE",
		};
	} else if (aboutPageColour[pathname]?.[cache.reversedScheme]) {
		return {
			colour: new colour(aboutPageColour[pathname][cache.reversedScheme]),
			reason: "PROTECTED_PAGE",
		};
	} else {
		return {
			colour: new colour("DEFAULT"),
			reason: "PROTECTED_PAGE",
		};
	}
}

/**
 * Gets the colour for a Mozilla domain page.
 *
 * @param {string} hostname - The hostname of the page.
 * @returns {{ colour: colour; reason: string }} Metadata.
 */
function getMozillaPageMeta(hostname) {
	if (mozillaPageColour[hostname]?.[cache.scheme]) {
		return {
			colour: new colour(mozillaPageColour[hostname][cache.scheme]),
			reason: "PROTECTED_PAGE",
		};
	} else if (mozillaPageColour[hostname]?.[cache.reversedScheme]) {
		return {
			colour: new colour(
				mozillaPageColour[hostname][cache.reversedScheme],
			),
			reason: "PROTECTED_PAGE",
		};
	} else {
		return {
			colour: new colour("FALLBACK"),
			reason: "PROTECTED_PAGE",
		};
	}
}

/**
 * Gets the colour for an extension page.
 *
 * @async
 * @param {string} url - The URL of the page.
 * @returns {Promise<{ colour: colour; reason: string; info?: string }>}
 *   Metadata.
 */
async function getAddonPageMeta(url) {
	const addonId = await getAddonId(url);
	if (!addonId) return { colour: new colour("ADDON"), reason: "ADDON" };
	const policy = pref.getPolicy(addonId).policy;
	return policy
		? {
				colour: new colour(policy.value),
				reason: "ADDON",
				info: addonId,
			}
		: {
				colour: new colour("ADDON"),
				reason: "ADDON",
				info: addonId,
			};
}

/**
 * Applies the colour to the browser frame.
 *
 * @param {tabs.Tab} tab - The active tab.
 * @param {colour} colour - The colour to apply.
 */
function setFrameColour(tab, colour) {
	if (!tab?.active) return;
	const windowId = tab.windowId;
	let finalColour, finalScheme;

	if (colour.code) {
		if (colourCode[colour.code][cache.scheme]) {
			finalColour = colourCode[colour.code][cache.scheme];
			finalScheme = cache.scheme;
		} else if (
			colourCode[colour.code][cache.reversedScheme] &&
			pref.allowDarkLight
		) {
			finalColour = colourCode[colour.code][cache.reversedScheme];
			finalScheme = cache.reversedScheme;
		} else {
			const correctionResult = colourCode[colour][
				cache.reversedScheme
			].contrastCorrection(
				cache.scheme,
				pref.compatibilityMode ? false : pref.allowDarkLight,
				pref.minContrast_light,
				pref.minContrast_dark,
			);
			finalColour = correctionResult.colour;
			finalScheme = correctionResult.scheme;
			cache.meta[windowId].corrected = correctionResult.corrected;
		}
	} else {
		const correctionResult = colour.contrastCorrection(
			cache.scheme,
			pref.compatibilityMode ? false : pref.allowDarkLight,
			pref.minContrast_light,
			pref.minContrast_dark,
		);
		finalColour = correctionResult.colour;
		finalScheme = correctionResult.scheme;
		cache.meta[windowId].corrected = correctionResult.corrected;
	}

	if (pref.compatibilityMode) {
		setTabThemeColour(tab, finalColour);
	} else {
		applyTheme(windowId, finalColour, finalScheme);
	}
}

/**
 * Applies theme colour to a tab using content script (compatibility mode).
 *
 * Used when the theme API is not supported or compatibility mode is enabled.
 *
 * @async
 * @param {tabs.Tab} tab - The tab.
 * @param {colour} colour - The colour to apply.
 */
async function setTabThemeColour(tab, colour) {
	try {
		await sendMessage(tab.id, {
			header: "SET_THEME_COLOUR",
			colour: colour.brightness(pref.tabbar).toRGBA(),
		});
	} catch (error) {
		console.warn("Could not apply theme colour to tab:", tab.url);
	}
}

/**
 * Applies a browser theme to a window.
 *
 * @param {number} windowId - The window ID.
 * @param {colour} colour - The base colour.
 * @param {"light" | "dark"} colourScheme - The colour scheme.
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
 */
function applyTheme(windowId, colour, colourScheme) {
	if (colourScheme === "light") {
		const textColour = "#000000";
		const secondaryColour = "#0000001c";
		const theme = {
			colors: {
				// adaptive
				button_background_active: colour
					.brightness(-1.5 * pref.tabSelected)
					.toRGBA(),
				frame: colour.brightness(-1.5 * pref.tabbar).toRGBA(),
				frame_inactive: colour.brightness(-1.5 * pref.tabbar).toRGBA(),
				ntp_background: colourCode.HOME[cache.scheme].toRGBA(),
				popup: colour.brightness(-1.5 * pref.popup).toRGBA(),
				popup_border: colour
					.brightness(-1.5 * (pref.popup + pref.popupBorder))
					.toRGBA(),
				sidebar: colour.brightness(-1.5 * pref.sidebar).toRGBA(),
				sidebar_border: colour
					.brightness(-1.5 * (pref.sidebar + pref.sidebarBorder))
					.toRGBA(),
				tab_line: colour
					.brightness(
						-1.5 * (pref.tabSelectedBorder + pref.tabSelected),
					)
					.toRGBA(),
				tab_selected: colour
					.brightness(-1.5 * pref.tabSelected)
					.toRGBA(),
				toolbar: colour.brightness(-1.5 * pref.toolbar).toRGBA(),
				toolbar_bottom_separator: colour
					.brightness(-1.5 * (pref.toolbarBorder + pref.toolbar))
					.toRGBA(),
				toolbar_field: colour
					.brightness(-1.5 * pref.toolbarField)
					.toRGBA(),
				toolbar_field_border: colour
					.brightness(
						-1.5 * (pref.toolbarFieldBorder + pref.toolbarField),
					)
					.toRGBA(),
				toolbar_field_focus: colour
					.brightness(-1.5 * pref.toolbarFieldOnFocus)
					.toRGBA(),
				toolbar_top_separator:
					pref.tabbarBorder === 0
						? "transparent"
						: colour
								.brightness(
									-1.5 * (pref.tabbarBorder + pref.tabbar),
								)
								.toRGBA(),
				// static
				icons: textColour,
				ntp_text: textColour,
				popup_text: textColour,
				sidebar_text: textColour,
				tab_background_text: textColour,
				tab_text: textColour,
				toolbar_field_text: textColour,
				toolbar_text: textColour,
				button_background_hover: secondaryColour,
				toolbar_vertical_separator: secondaryColour,
				toolbar_field_border_focus: "AccentColor",
				popup_highlight: "AccentColor",
				sidebar_highlight: "AccentColor",
				icons_attention: "AccentColor",
			},
			properties: {
				color_scheme: "system",
				content_color_scheme: "system",
			},
		};
		updateBrowserTheme(windowId, theme);
	} else if (colourScheme === "dark") {
		const textColour = "#ffffff";
		const secondaryColour = "#ffffff1c";
		const theme = {
			colors: {
				// adaptive
				button_background_active: colour
					.brightness(pref.tabSelected)
					.toRGBA(),
				frame: colour.brightness(pref.tabbar).toRGBA(),
				frame_inactive: colour.brightness(pref.tabbar).toRGBA(),
				ntp_background: colourCode.HOME[cache.scheme].toRGBA(),
				popup: colour.brightness(pref.popup).toRGBA(),
				popup_border: colour
					.brightness(pref.popup + pref.popupBorder)
					.toRGBA(),
				sidebar: colour.brightness(pref.sidebar).toRGBA(),
				sidebar_border: colour
					.brightness(pref.sidebar + pref.sidebarBorder)
					.toRGBA(),
				tab_line: colour
					.brightness(pref.tabSelectedBorder + pref.tabSelected)
					.toRGBA(),
				tab_selected: colour.brightness(pref.tabSelected).toRGBA(),
				toolbar: colour.brightness(pref.toolbar).toRGBA(),
				toolbar_bottom_separator: colour
					.brightness(pref.toolbarBorder + pref.toolbar)
					.toRGBA(),
				toolbar_field: colour.brightness(pref.toolbarField).toRGBA(),
				toolbar_field_border: colour
					.brightness(pref.toolbarFieldBorder + pref.toolbarField)
					.toRGBA(),
				toolbar_field_focus: colour
					.brightness(pref.toolbarFieldOnFocus)
					.toRGBA(),
				toolbar_top_separator:
					pref.tabbarBorder === 0
						? "transparent"
						: colour
								.brightness(pref.tabbarBorder + pref.tabbar)
								.toRGBA(),
				// static
				icons: textColour,
				ntp_text: textColour,
				popup_text: textColour,
				sidebar_text: textColour,
				tab_background_text: textColour,
				tab_text: textColour,
				toolbar_field_text: textColour,
				toolbar_text: textColour,
				button_background_hover: secondaryColour,
				toolbar_vertical_separator: secondaryColour,
				toolbar_field_border_focus: "AccentColor",
				popup_highlight: "AccentColor",
				sidebar_highlight: "AccentColor",
				icons_attention: "AccentColor",
			},
			properties: {
				color_scheme: "system",
				content_color_scheme: "system",
			},
		};
		updateBrowserTheme(windowId, theme);
	}
}

(async () => {
	await pref.initialise();
	pref.setOnChangeListener(run);
	addSchemeChangeListener(run);
	addTabChangeListener(run);
	addMessageListener(handleMessage);
	await run();
})();
