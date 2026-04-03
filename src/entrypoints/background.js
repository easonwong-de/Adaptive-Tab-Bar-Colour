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

import preference from "@/utils/preference.js";
import colour from "@/utils/colour.js";
import {
	aboutPageColour,
	mozillaPageColour,
	presetAddonPageColour,
} from "@/utils/constants.js";
import {
	addMessageListener,
	addSchemeChangeListener,
	addTabChangeListener,
	getActiveTabList,
	getAddonId,
	getAddonName,
	getCurrentScheme,
	getSystemScheme,
	sendMessage,
	updateBrowserTheme,
} from "@/utils/utility.js";

/** Preference */
const pref = new preference();

/** Page colour of Firefox internal page. */
const browserColour = Object.freeze({
	get HOME() {
		return cache.scheme === "light"
			? new colour(pref.homeBackground_light)
			: new colour(pref.homeBackground_dark);
	},
	get FALLBACK() {
		return cache.scheme === "light"
			? new colour(pref.fallbackColour_light)
			: new colour(pref.fallbackColour_dark);
	},
	get PLAINTEXT() {
		return cache.scheme === "light"
			? new colour().rgba(255, 255, 255, 1)
			: new colour().rgba(28, 27, 34, 1);
	},
	get SYSTEM() {
		return cache.scheme === "light"
			? new colour().rgba(255, 255, 255, 1)
			: new colour().rgba(30, 30, 30, 1);
	},
	get ADDON() {
		return cache.scheme === "light"
			? new colour().rgba(236, 236, 236, 1)
			: new colour().rgba(50, 50, 50, 1);
	},
	get PDFVIEWER() {
		return cache.scheme === "light"
			? new colour().rgba(249, 249, 250, 1)
			: new colour().rgba(56, 56, 61, 1);
	},
	get IMAGEVIEWER() {
		return new colour().rgba(33, 33, 33, 1);
	},
	get JSONVIEWER() {
		const resolved = {
			light:
				getSystemScheme() === "light"
					? new colour().rgba(249, 249, 250, 1)
					: undefined,
			dark:
				getSystemScheme() === "dark"
					? new colour().rgba(12, 12, 13, 1)
					: undefined,
		};
		return resolved[cache.scheme] || resolved[cache.reversedScheme];
	},
	get DEFAULT() {
		return cache.scheme === "light"
			? new colour().rgba(255, 255, 255, 1)
			: new colour().rgba(28, 27, 34, 1);
	},
});

/** Cache */
const cache = {
	/** `windowId: { id, rule: {headerType, header, type, value }}` */
	rule: {},
	/** `windowId: { colour, reason, info }` */
	meta: {},
	/** `windowId: { popupColour, scheme, corrected }` */
	theme: {},
	/** The preferred colour scheme of current setup, `light` or `dark` */
	scheme: "light",
	/** The reversed colour theme. */
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	/** Update `scheme` & clear `info` and `rule`. */
	async clear() {
		this.scheme = await getCurrentScheme();
		this.rule = {};
		this.meta = {};
		this.theme = {};
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
			if (tab) updateTab(tab);
			break;
		case "UPDATE_COLOUR":
			if (!tab) break;
			const tabMeta = parseTabColour(
				cache.rule[tab.windowId].rule,
				message.colour,
			);
			setFrameColour(tab, tabMeta);
			break;
		case "SCHEME_REQUEST":
			return await getCurrentScheme();
		case "CACHE_REQUEST":
			return {
				rule: cache.rule[message.windowId],
				meta: cache.meta[message.windowId],
				theme: cache.theme[message.windowId],
			};
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
	const rule = pref.getRule(tab.url);
	cache.rule[windowId] = rule;
	const meta = await getTabMeta(rule.rule, tab);
	cache.meta[windowId] = meta;
	cache.theme[windowId] = setFrameColour(tab, meta);
}

/**
 * Determines the appropriate colour meta for a tab.
 *
 * @async
 * @param {object} rule - The rule object.
 * @param {tabs.Tab} tab - The tab to extract colour from.
 * @returns {Promise<{ colour: colour; reason: string; info?: string }>} Tab
 *   metadata.
 */
async function getTabMeta(rule, tab) {
	try {
		const tabColour = await sendMessage(tab.id, {
			header: "GET_COLOUR",
			dynamic: rule?.type === "COLOUR" ? false : pref.dynamic,
			query: rule?.type === "QUERY_SELECTOR" ? rule.value : undefined,
		});
		return parseTabColour(rule, tabColour);
	} catch (error) {
		console.warn("Failed to connect to", tab.url);
		if (rule?.headerType === "URL" && rule?.type === "COLOUR") {
			return {
				colour: new colour(rule.value),
				reason: "COLOUR_SPECIFIED",
			};
		} else return await getProtectedPageMeta(tab);
	}
}

/**
 * Parses tab colour data based on rule.
 *
 * @param {object} rule - The rule object.
 * @param {object} tabColour - The tab colour data.
 * @param {{ light?: string; dark?: string }} tabColour.theme - Theme colour
 *   data.
 * @param {{ colour: string; opacity: string; filter: string }[]} tabColour.page
 *   - Page element colour data.
 *
 * @param {{ colour: string; opacity: string; filter: string }} [tabColour.query]
 *   - Query selector result.
 *
 * @param {boolean} tabColour.image - If the tab is image viewer.
 * @returns {{ colour: colour; reason: string; info?: string }} Parsed metadata.
 */
function parseTabColour(rule, { theme, page, query, image }) {
	const parseThemeColour = () => new colour(theme[cache.scheme]);
	const parsePageColour = () => {
		if (image) return browserColour.IMAGEVIEWER;
		let pageColour = new colour();
		for (const element of page) {
			const opacity = parseFloat(element.opacity);
			if (isNaN(opacity)) continue;
			pageColour = pageColour.mix(
				new colour(element.colour).opacity(opacity),
			);
			if (pageColour.isOpaque()) return pageColour;
		}
		return pageColour.mix(browserColour.FALLBACK);
	};
	const parseQueryColour = () => new colour(query?.colour);
	switch (rule?.type) {
		case "THEME_COLOUR": {
			const themeColour = parseThemeColour();
			return themeColour.isOpaque()
				? rule?.value
					? {
							colour: themeColour,
							reason: pref.noThemeColour
								? "THEME_UNIGNORED"
								: "THEME_USED",
						}
					: {
							colour: parsePageColour(),
							reason: "THEME_IGNORED",
						}
				: {
						colour: parsePageColour(),
						reason: rule?.value ? "THEME_MISSING" : "COLOUR_PICKED",
					};
		}
		case "QUERY_SELECTOR": {
			const queryColour = parseQueryColour();
			return queryColour.isOpaque()
				? {
						colour: queryColour,
						reason: "QS_USED",
						info: rule?.value || "🕳️",
					}
				: {
						colour: parsePageColour(),
						reason: "QS_FAILED",
						info: rule?.value || "🕳️",
					};
		}
		case "COLOUR": {
			return {
				colour: new colour(rule?.value),
				reason: "COLOUR_SPECIFIED",
			};
		}
		default:
			const themeColour = parseThemeColour();
			return themeColour.isOpaque()
				? pref.noThemeColour
					? {
							colour: parsePageColour(),
							reason: "THEME_IGNORED",
						}
					: {
							colour: themeColour,
							reason: "THEME_USED",
						}
				: {
						colour: parsePageColour(),
						reason: image ? "IMAGE_VIEWER" : "COLOUR_PICKED",
					};
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
	if (!tab.url) {
		return {
			colour: browserColour.FALLBACK,
			reason: "ERROR_OCCURRED",
		};
	}
	const url = new URL(tab.url);
	const tabTitle = tab.title || "";
	if (
		["about:firefoxview", "about:home", "about:newtab"].some((href) =>
			url.href.startsWith(href),
		)
	) {
		return { colour: browserColour.HOME, reason: "HOME_PAGE" };
	} else if (
		url.href === "about:blank" &&
		tabTitle.startsWith("about:") &&
		tabTitle.endsWith("profile")
	) {
		return getAboutPageMeta(tabTitle.slice(6));
	} else if (url.protocol === "about:") {
		return getAboutPageMeta(url.pathname);
	} else if (url.protocol === "moz-extension:") {
		return await getAddonPageMeta(url.href);
	} else if (url.hostname in mozillaPageColour) {
		return getMozillaPageMeta(url.hostname);
	} else if (url.protocol === "view-source:") {
		return {
			colour: browserColour.PLAINTEXT,
			reason: "PROTECTED_PAGE",
		};
	} else if (["chrome:", "resource:", "jar:file:"].includes(url.protocol)) {
		if (
			[".txt", ".css", ".jsm", ".js"].some((extention) =>
				url.href.endsWith(extention),
			)
		) {
			return {
				colour: browserColour.PLAINTEXT,
				reason: "PROTECTED_PAGE",
			};
		} else if (
			[".png", ".jpg"].some((extention) => url.href.endsWith(extention))
		) {
			return {
				colour: browserColour.IMAGEVIEWER,
				reason: "PROTECTED_PAGE",
			};
		} else {
			return {
				colour: browserColour.SYSTEM,
				reason: "PROTECTED_PAGE",
			};
		}
	} else if (url.href.startsWith("data:image")) {
		return {
			colour: browserColour.IMAGEVIEWER,
			reason: "IMAGE_VIEWER",
		};
	} else if (url.href.endsWith(".pdf") || tabTitle.endsWith(".pdf")) {
		return {
			colour: browserColour.PDFVIEWER,
			reason: "PDF_VIEWER",
		};
	} else if (url.href.endsWith(".json") || tabTitle.endsWith(".json")) {
		return {
			colour: browserColour.JSONVIEWER,
			reason: "JSON_VIEWER",
		};
	} else if (tab.favIconUrl?.startsWith("chrome:")) {
		return {
			colour: browserColour.DEFAULT,
			reason: "PROTECTED_PAGE",
		};
	} else if (url.href.match(new RegExp(`https?:\\/\\/${tabTitle}$`, "i"))) {
		return {
			colour: browserColour.PLAINTEXT,
			reason: "TEXT_VIEWER",
		};
	} else {
		return {
			colour: browserColour.FALLBACK,
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
		const val = aboutPageColour[pathname][cache.scheme];
		return {
			colour: browserColour[val] || new colour(val),
			reason: "PROTECTED_PAGE",
		};
	} else if (aboutPageColour[pathname]?.[cache.reversedScheme]) {
		const val = aboutPageColour[pathname][cache.reversedScheme];
		return {
			colour: browserColour[val] || new colour(val),
			reason: "PROTECTED_PAGE",
		};
	} else {
		return {
			colour: browserColour.DEFAULT,
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
		const val = mozillaPageColour[hostname][cache.scheme];
		return {
			colour: browserColour[val] || new colour(val),
			reason: "PROTECTED_PAGE",
		};
	} else if (mozillaPageColour[hostname]?.[cache.reversedScheme]) {
		const val = mozillaPageColour[hostname][cache.reversedScheme];
		return {
			colour: browserColour[val] || new colour(val),
			reason: "PROTECTED_PAGE",
		};
	} else {
		return {
			colour: browserColour.FALLBACK,
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
	if (!addonId)
		return { colour: browserColour.FALLBACK, reason: "ERROR_OCCURRED" };
	const rule = pref.getRule(addonId).rule;
	const addonName = await getAddonName(addonId);
	if (rule) {
		return {
			colour: new colour(rule.value),
			reason: "ADDON_SPECIFIED",
			info: addonName,
		};
	} else if (presetAddonPageColour[addonId]?.[cache.scheme]) {
		return {
			colour: new colour(presetAddonPageColour[addonId][cache.scheme]),
			reason: "ADDON_PRESET",
			info: addonName,
		};
	} else if (presetAddonPageColour[addonId]?.[cache.reversedScheme]) {
		return {
			colour: new colour(
				presetAddonPageColour[addonId][cache.reversedScheme],
			),
			reason: "ADDON_PRESET",
			info: addonName,
		};
	} else {
		return {
			colour: browserColour.ADDON,
			reason: "ADDON_DEFAULT",
			info: addonName,
		};
	}
}

/**
 * Applies the colour to the browser frame and updates cache.
 *
 * @param {tabs.Tab} tab - The active tab.
 * @param {{ colour: colour; reason: string; info?: string }} meta - The tab
 *   metadata.
 * @returns {{
 * 	popup: string;
 * 	scheme: "light" | "dark";
 * 	corrected: boolean;
 * }}
 *   Theme metadata.
 */
function setFrameColour(tab, meta) {
	if (!tab?.active || !meta.colour) return;
	const windowId = tab.windowId;
	const correctionResult = meta.colour.contrastCorrection(
		cache.scheme,
		!pref.compatibilityMode && pref.allowDarkLight,
		pref.minContrast_light,
		pref.minContrast_dark,
	);
	const colour = correctionResult.colour;
	const scheme = correctionResult.scheme;
	const corrected = correctionResult.corrected;
	pref.compatibilityMode
		? setTabThemeColour(tab, colour)
		: applyTheme(windowId, colour, scheme);
	return {
		popup: colour
			.brightness((scheme === "light" ? -1.5 : 1) * pref.popup)
			.toRGBA(),
		scheme: scheme,
		corrected: corrected,
	};
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
 * @param {"light" | "dark"} scheme - The colour scheme.
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
 */
function applyTheme(windowId, colour, scheme) {
	if (scheme === "light") {
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
				ntp_background: browserColour.HOME.toRGBA(),
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
	} else if (scheme === "dark") {
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
				ntp_background: browserColour.HOME.toRGBA(),
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

export default defineBackground(() => {
	(async () => {
		await pref.initialise();
		pref.setOnChangeListener(run);
		addSchemeChangeListener(run);
		addTabChangeListener(run);
		addMessageListener(handleMessage);
		await run();
	})();
});
