"use strict";

/*
 * Definitions of some concepts
 *
 * System colour scheme:
 * The colour scheme of the operating system, usually light or dark.
 *
 * Browser colour scheme:
 * The "website appearance" settings of Firefox, which can be light, dark, or auto.
 *
 * current.scheme:
 * Derived from System and Browser colour scheme and decides whether the light theme or dark theme is preferred.
 *
 * pref.allowDarkLight:
 * A setting that decides if a light theme is allowed to be used when current.scheme is dark, or vice versa.
 *
 * theme-color / meta theme colour:
 * A colour defined with a meta tag by some websites, usually static.
 * It is often more related to the branding than the appearance of the website.
 *
 * Theme:
 * An object that defines the appearance of the Firefox chrome.
 */

import preference from "./preference.js";
import colour from "./colour.js";
import { aboutPageColour, mozillaPageColour } from "./constants.js";
import {
	onSchemeChanged,
	getCurrentScheme,
	getSystemScheme,
	getAddonId,
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

/** Triggers colour change in all windows. */
async function update() {
	if (!pref.valid()) await initialise();
	await cache.clear();
	const activeTabs = await browser.tabs.query({
		active: true,
		status: "complete",
	});
	activeTabs.forEach(updateTab);
}

/** Initialises `pref` and `current`. */
async function initialise() {
	await pref.load();
	await pref.normalise();
	await pref.save();
	await update();
}

/**
 * Handles incoming messages based on their `header`.
 *
 * @param {object} message - The message object containing the `header` and any
 *   additional data.
 * @param {runtime.MessageSender} sender - The message sender.
 * @returns {Promise<boolean | string | object>} Response data or true for
 *   acknowledgment.
 */
async function handleMessage(message, sender) {
	const tab = sender.tab;
	const header = message.header;
	switch (header) {
		case "INIT_REQUEST":
			await initialise();
			break;
		case "PREF_CHANGED":
			await pref.load();
			await update();
			break;
		case "SCRIPT_READY":
			updateTab(tab);
			break;
		case "UPDATE_COLOUR":
			const tabInfo = parseTabMessage(
				cache.policy[tab.windowId],
				message.colour,
			);
			cache.meta[tab.windowId] = tabInfo;
			setFrameColour(tab, tabInfo.colour);
			break;
		case "SCHEME_REQUEST":
			return await getCurrentScheme();
		case "META_REQUEST":
			return cache.meta[message.windowId];
		default:
			update();
	}
	return true;
}

/**
 * Stores tab's policy to cache, updates the colour for a tab. And caches the
 * meta info.
 *
 * @param {tabs.Tab} tab - The tab.
 */
async function updateTab(tab) {
	const windowId = tab.windowId;
	const policy = pref.getPolicy(tab.url).policy;
	cache.policy[windowId] = policy;
	const tabColour = await getTabColour(tab);
	cache.meta[windowId] = tabColour;
	setFrameColour(tab, tabColour.colour);
}

/**
 * Determines the appropriate colour for a tab.
 *
 * Tries to get the colour from the content script, falling back to policy or
 * protected page colour if needed.
 *
 * @param {tabs.Tab} tab - The tab to extract the colour from.
 * @returns {Promise<{ colour: colour; info?: string; reason: string }>} An
 *   object containing the colour, reason, and optional additional info.
 */
async function getTabColour(tab) {
	const policy = cache.policy[tab.windowId];
	if (policy?.headerType === "URL" && policy?.type === "COLOUR") {
		return {
			colour: new colour(policy.value),
			reason: "COLOUR_SPECIFIED",
		};
	} else {
		try {
			const tabResponse = await browser.tabs.sendMessage(tab.id, {
				header: "GET_COLOUR",
				active: policy?.type !== "COLOUR",
				dynamic: pref.dynamic,
				query: policy?.type === "QUERY_SELECTOR" ? policy.value : null,
			});
			return parseTabMessage(policy, tabResponse);
		} catch (error) {
			return await getProtectedPageColour(tab);
		}
	}
}

/**
 * Parses a tab message to determine the appropriate colour based on policy.
 *
 * @param {object} policy - The policy object containing type and value.
 * @param {object} message - The message object containing theme, page, and
 *   query data.
 * @param {object} message.theme - Theme colour data.
 * @param {Array} message.page - Array of page colour data.
 * @param {object} message.query - Query selector colour data.
 * @returns {{ colour: colour; reason: string }} The colour information based on
 *   the policy.
 */
function parseTabMessage(policy, { theme, page, query }) {
	const getPageColour = () => {
		let pageColour = new colour();
		for (const pageItem of page) {
			pageColour = pageColour.mix(
				new colour(pageItem.colour, false).applyOpacity(
					pageItem.opacity,
				),
			);
			if (pageColour.isOpaque()) break;
		}
		return pageColour.isOpaque()
			? pageColour
			: pageColour.mix(new colour("FALLBACK"));
	};
	const getThemeColour = () => new colour(theme[cache.scheme], false);
	const getQueryColour = () => new colour(query.colour);
	switch (policy?.type) {
		case "THEME_COLOUR": {
			const themeColour = getThemeColour();
			if (policy.value && themeColour.isOpaque()) {
				return {
					colour: themeColour,
					reason: "THEME_USED",
				};
			}
			return {
				colour: getPageColour(),
				reason: policy.value
					? "THEME_MISSING"
					: themeColour.isOpaque()
						? "THEME_IGNORED"
						: "COLOUR_PICKED",
			};
		}
		case "QUERY_SELECTOR": {
			const queryColour = getQueryColour();
			return queryColour.isOpaque()
				? { colour: queryColour, reason: "QS_USED" }
				: { colour: getPageColour(), reason: "QS_FAILED" };
		}
		default:
			return { colour: getPageColour(), reason: "COLOUR_PICKED" };
	}
}

/**
 * Determines the colour for a protected page.
 *
 * @param {tabs.Tab} tab - The tab.
 * @returns {Promise<{ colour: colour; reason: string; info?: string }>} The
 *   colour information for the protected page.
 */
async function getProtectedPageColour(tab) {
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
		return getAboutPageColour(tab.title.slice(6));
	} else if (url.protocol === "about:") {
		return getAboutPageColour(url.pathname);
	} else if (url.protocol === "moz-extension:") {
		return await getAddonPageColour(url.href);
	} else if (url.hostname in mozillaPageColour) {
		return getMozillaPageColour(url.hostname);
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
 * Gets the colour for an about page based on its pathname.
 *
 * @param {string} pathname - The pathname of the about page.
 * @returns {{ colour: colour; reason: string }} The colour information for the
 *   about page.
 */
function getAboutPageColour(pathname) {
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
 * Gets the colour for a Mozilla page based on its hostname.
 *
 * @param {string} hostname - The hostname of the Mozilla page.
 * @returns {{ colour: colour; reason: string }} The colour information for the
 *   Mozilla page.
 */
function getMozillaPageColour(hostname) {
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
 * Gets the colour for an addon page based on its URL.
 *
 * @param {string} url - The URL of the addon page.
 * @returns {Promise<{ colour: colour; reason: string; info?: string }>} The
 *   colour information for the addon page.
 */
async function getAddonPageColour(url) {
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
 * Applies given colour to the browser frame of a tab.
 *
 * Colour will be adjusted until the contrast ratio is adequate, and it will be
 * stored in `current.info`.
 *
 * @param {tabs.Tab} tab - The tab in a window, whose frame is being changed.
 * @param {colour} colour - The colour to apply to the frame.
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
 * Applies theme colour to the tab (theme API not supported).
 *
 * @param {tabs.Tab} tab - The tab to apply the theme color to.
 * @param {colour} colour - The colour to apply.
 */
async function setTabThemeColour(tab, colour) {
	try {
		await browser.tabs.sendMessage(tab.id, {
			header: "SET_THEME_COLOUR",
			colour: colour.dim(pref.tabbar).toRGBA(),
		});
	} catch (error) {
		console.warn("Could not apply theme colour to tab:", tab.url);
	}
}

/**
 * Constructs a theme and applies it to a given window.
 *
 * @param {number} windowId - The ID of the window.
 * @param {colour} colour - Colour of the frame.
 * @param {string} colourScheme - `light` or `dark`.
 */
function applyTheme(windowId, colour, colourScheme) {
	if (colourScheme === "light") {
		const theme = {
			colors: {
				// adaptive
				button_background_active: colour
					.dim(-1.5 * pref.tabSelected)
					.toRGBA(),
				frame: colour.dim(-1.5 * pref.tabbar).toRGBA(),
				frame_inactive: colour.dim(-1.5 * pref.tabbar).toRGBA(),
				ntp_background: colourCode.HOME[cache.scheme].toRGBA(),
				popup: colour.dim(-1.5 * pref.popup).toRGBA(),
				popup_border: colour
					.dim(-1.5 * (pref.popup + pref.popupBorder))
					.toRGBA(),
				sidebar: colour.dim(-1.5 * pref.sidebar).toRGBA(),
				sidebar_border: colour
					.dim(-1.5 * (pref.sidebar + pref.sidebarBorder))
					.toRGBA(),
				tab_line: colour
					.dim(-1.5 * (pref.tabSelectedBorder + pref.tabSelected))
					.toRGBA(),
				tab_selected: colour.dim(-1.5 * pref.tabSelected).toRGBA(),
				toolbar: colour.dim(-1.5 * pref.toolbar).toRGBA(),
				toolbar_bottom_separator:
					pref.toolbarBorder === 0
						? "transparent"
						: colour
								.dim(-1.5 * (pref.toolbarBorder + pref.toolbar))
								.toRGBA(),
				toolbar_field: colour.dim(-1.5 * pref.toolbarField).toRGBA(),
				toolbar_field_border: colour
					.dim(-1.5 * (pref.toolbarFieldBorder + pref.toolbarField))
					.toRGBA(),
				toolbar_field_focus: colour
					.dim(-1.5 * pref.toolbarFieldOnFocus)
					.toRGBA(),
				toolbar_top_separator:
					pref.tabbarBorder === 0
						? "transparent"
						: colour
								.dim(-1.5 * (pref.tabbarBorder + pref.tabbar))
								.toRGBA(),
				// static
				icons: "rgb(0, 0, 0)",
				ntp_text: "rgb(0, 0, 0)",
				popup_text: "rgb(0, 0, 0)",
				sidebar_text: "rgb(0, 0, 0)",
				tab_background_text: "rgb(0, 0, 0)",
				tab_text: "rgb(0, 0, 0)",
				toolbar_field_text: "rgb(0, 0, 0)",
				toolbar_text: "rgb(0, 0, 0)",
				button_background_hover: "rgba(0, 0, 0, 0.11)",
				toolbar_vertical_separator: "rgba(0, 0, 0, 0.11)",
				toolbar_field_border_focus: "AccentColor",
				popup_highlight: "AccentColor",
				sidebar_highlight: "AccentColor",
				icons_attention: "AccentColor",
			},
			properties: {
				// More on: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme#properties
				color_scheme: "system",
				content_color_scheme: "system",
			},
		};
		browser.theme.update(windowId, theme);
	}
	if (colourScheme === "dark") {
		const theme = {
			colors: {
				// adaptive
				button_background_active: colour.dim(pref.tabSelected).toRGBA(),
				frame: colour.dim(pref.tabbar).toRGBA(),
				frame_inactive: colour.dim(pref.tabbar).toRGBA(),
				ntp_background: colourCode.HOME[cache.scheme].toRGBA(),
				popup: colour.dim(pref.popup).toRGBA(),
				popup_border: colour
					.dim(pref.popup + pref.popupBorder)
					.toRGBA(),
				sidebar: colour.dim(pref.sidebar).toRGBA(),
				sidebar_border: colour
					.dim(pref.sidebar + pref.sidebarBorder)
					.toRGBA(),
				tab_line: colour
					.dim(pref.tabSelectedBorder + pref.tabSelected)
					.toRGBA(),
				tab_selected: colour.dim(pref.tabSelected).toRGBA(),
				toolbar: colour.dim(pref.toolbar).toRGBA(),
				toolbar_bottom_separator:
					pref.toolbarBorder === 0
						? "transparent"
						: colour
								.dim(pref.toolbarBorder + pref.toolbar)
								.toRGBA(),
				toolbar_field: colour.dim(pref.toolbarField).toRGBA(),
				toolbar_field_border: colour
					.dim(pref.toolbarFieldBorder + pref.toolbarField)
					.toRGBA(),
				toolbar_field_focus: colour
					.dim(pref.toolbarFieldOnFocus)
					.toRGBA(),
				toolbar_top_separator:
					pref.tabbarBorder === 0
						? "transparent"
						: colour.dim(pref.tabbarBorder + pref.tabbar).toRGBA(),
				// static
				icons: "rgb(255, 255, 255)",
				ntp_text: "rgb(255, 255, 255)",
				popup_text: "rgb(255, 255, 255)",
				sidebar_text: "rgb(255, 255, 255)",
				tab_background_text: "rgb(255, 255, 255)",
				tab_text: "rgb(255, 255, 255)",
				toolbar_field_text: "rgb(255, 255, 255)",
				toolbar_text: "rgb(255, 255, 255)",
				button_background_hover: "rgba(255, 255, 255, 0.11)",
				toolbar_vertical_separator: "rgba(255, 255, 255, 0.11)",
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
		browser.theme.update(windowId, theme);
	}
}

(async () => {
	await initialise();
	onSchemeChanged(update);
	browser.tabs.onUpdated.addListener(update, { properties: ["status"] });
	browser.tabs.onActivated.addListener(update);
	browser.tabs.onAttached.addListener(update);
	browser.windows.onFocusChanged.addListener(update);
	browser.browserSettings?.overrideContentColorScheme?.onChange?.addListener(
		update,
	);
	browser.runtime.onMessage.addListener(handleMessage);
})();
