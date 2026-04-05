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
	getCurrentWindowId,
	sendMessageToPopup,
	getSystemScheme,
	sendMessageToTab,
	updateBrowserTheme,
} from "@/utils/utility.js";
import type {
	ApplyThemeResult,
	Scheme,
	Rule,
	RuleQueryResult,
	MessageForBackground,
	MessageForTab,
	TabColourData,
	MetaQueryResult,
	Theme,
	MessageForPopup,
} from "@/utils/types.js";

/** Preference instance. */
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
		return getSystemScheme() === "light"
			? new colour().rgba(249, 249, 250, 1)
			: new colour().rgba(12, 12, 13, 1);
	},
	get DEFAULT() {
		return cache.scheme === "light"
			? new colour().rgba(255, 255, 255, 1)
			: new colour().rgba(28, 27, 34, 1);
	},
});

/** Runtime cache. */
const cache: {
	rule: Record<number, RuleQueryResult>;
	meta: Record<number, MetaQueryResult>;
	theme: Record<number, ApplyThemeResult>;
	scheme: Scheme;
	readonly reversedScheme: Scheme;
	clear: () => Promise<void>;
} = {
	rule: {},
	meta: {},
	theme: {},
	scheme: "light",
	/** The reversed colour theme. */
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	/** Updates `scheme` and clears `rule`, `meta`, and `theme`. */
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
 * @param {MessageForBackground} message - The runtime message payload.
 * @param {Browser.runtime.MessageSender} sender - Metadata about the sender.
 * @returns {Promise<unknown>} Message response payload.
 */
async function handleMessage(
	message: MessageForBackground,
	sender: Browser.runtime.MessageSender,
): Promise<unknown> {
	const tab = sender.tab;
	const header = message.header;
	switch (header) {
		case "SCRIPT_READY":
			if (tab === undefined) break;
			updateTab(tab);
			break;
		case "UPDATE_COLOUR":
			if (tab === undefined) break;
			const windowId = tab.windowId;
			const meta = parseTabColour(
				message.colour,
				cache.rule[windowId]?.rule ?? null,
			);
			cache.meta[windowId] = meta;
			cache.theme[tab.windowId] = setFrameColour(tab, meta);
			sendMessageToPopup({ header: "CACHE_UPDATED" });
			break;
		case "SCHEME_REQUEST":
			return await getCurrentScheme();
		case "CACHE_REQUEST": {
			const windowId = await getCurrentWindowId(tab);
			if (windowId === undefined) return undefined;
			return {
				rule: cache.rule[windowId],
				meta: cache.meta[windowId],
				theme: cache.theme[windowId],
			};
		}
		default:
			await run();
	}
	return true;
}

/**
 * Triggers colour update for all active tabs.
 *
 * @returns {Promise<void>} Resolves when all active tabs are processed.
 */
async function run(): Promise<void> {
	await cache.clear();
	(await getActiveTabList()).forEach(updateTab);
}

/**
 * Updates the colour for a tab and caches its meta information.
 *
 * @param {Browser.tabs.Tab} tab - The target tab.
 * @returns {Promise<void>} Resolves when tab processing is completed.
 */
async function updateTab(tab: Browser.tabs.Tab): Promise<void> {
	const windowId = tab.windowId;
	const ruleQueryResult = pref.getRule(tab.url);
	cache.rule[windowId] = ruleQueryResult;
	const meta = await getTabMeta(tab, ruleQueryResult.rule);
	cache.meta[windowId] = meta;
	cache.theme[windowId] = setFrameColour(tab, meta);
	sendMessageToPopup({ header: "CACHE_UPDATED" });
}

/**
 * Determines the appropriate colour metadata for a tab.
 *
 * @param {Browser.tabs.Tab} tab - Target browser tab.
 * @param {Rule} rule - Matched rule for the tab URL.
 * @returns {Promise<MetaQueryResult>} Resolved metadata used for theme application.
 */
async function getTabMeta(
	tab: Browser.tabs.Tab,
	rule: Rule,
): Promise<MetaQueryResult> {
	const getFallbackMeta = async (): Promise<MetaQueryResult> => {
		console.warn("Failed to connect to", tab.url);
		if (rule?.headerType === "URL" && rule?.type === "COLOUR") {
			return {
				colour: new colour(rule.value),
				reason: "COLOUR_SPECIFIED",
			};
		}
		return await getProtectedPageMeta(tab);
	};

	if (!tab.id) return await getFallbackMeta();
	try {
		const message: MessageForTab = {
			header: "GET_COLOUR",
			dynamic: rule?.type === "COLOUR" ? false : pref.dynamic,
			query: rule?.type === "QUERY_SELECTOR" ? rule.value : undefined,
		};
		const tabColour = await sendMessageToTab<TabColourData>(
			tab.id,
			message,
		);
		return parseTabColour(tabColour, rule);
	} catch (error) {
		return await getFallbackMeta();
	}
}

/**
 * Parses tab colour data according to rule configuration.
 *
 * @param {TabColourData} colourData - Colour data from content script.
 * @param {Rule} rule - Matched rule or `null`.
 * @returns {MetaQueryResult} Parsed metadata for theme application.
 */
function parseTabColour(
	{ theme, page, query, image }: TabColourData,
	rule: Rule,
): MetaQueryResult {
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
 * Determines the colour metadata for a protected page.
 *
 * @param {Browser.tabs.Tab} tab - The protected tab.
 * @returns {Promise<MetaQueryResult>} Protected-page metadata.
 */
async function getProtectedPageMeta(
	tab: Browser.tabs.Tab,
): Promise<MetaQueryResult> {
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
		const addonId = await getAddonId(url.href);
		if (addonId) {
			const ruleQueryResult = pref.getRule(addonId);
			cache.rule[tab.windowId] = ruleQueryResult;
			return await getAddonPageMeta(addonId, ruleQueryResult);
		} else {
			cache.rule[tab.windowId] = { id: 0, query: "", rule: null };
			return {
				colour: browserColour.ADDON,
				reason: "ADDON_DEFAULT",
				info: i18n.t("addonNotFound"),
			};
		}
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
 * Gets the colour metadata for an `about:` page.
 *
 * @param {string} pathname - `about:` page pathname.
 * @returns {MetaQueryResult} Metadata for the page.
 */
function getAboutPageMeta(pathname: string): MetaQueryResult {
	const currentSchemeValue = aboutPageColour[pathname]?.[cache.scheme];
	if (currentSchemeValue) {
		return {
			colour:
				(browserColour as Record<string, colour | undefined>)[
					currentSchemeValue
				] || new colour(currentSchemeValue),
			reason: "PROTECTED_PAGE",
		};
	}
	const reversedSchemeValue =
		aboutPageColour[pathname]?.[cache.reversedScheme];
	if (reversedSchemeValue) {
		return {
			colour:
				(browserColour as Record<string, colour | undefined>)[
					reversedSchemeValue
				] || new colour(reversedSchemeValue),
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
 * Gets the colour metadata for a Mozilla domain page.
 *
 * @param {string} hostname - Page hostname.
 * @returns {MetaQueryResult} Metadata for the page.
 */
function getMozillaPageMeta(hostname: string): MetaQueryResult {
	const currentSchemeValue = mozillaPageColour[hostname]?.[cache.scheme];
	if (currentSchemeValue) {
		return {
			colour:
				(browserColour as Record<string, colour | undefined>)[
					currentSchemeValue
				] || new colour(currentSchemeValue),
			reason: "PROTECTED_PAGE",
		};
	}
	const reversedSchemeValue =
		mozillaPageColour[hostname]?.[cache.reversedScheme];
	if (reversedSchemeValue) {
		return {
			colour:
				(browserColour as Record<string, colour | undefined>)[
					reversedSchemeValue
				] || new colour(reversedSchemeValue),
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
 * Gets the colour metadata for an extension page.
 *
 * @param {string} addonId - The extension ID.
 * @param {RuleQueryResult} rule - Rule query result.
 * @returns {Promise<MetaQueryResult>} Metadata for the extension page.
 */
async function getAddonPageMeta(
	addonId: string,
	rule: RuleQueryResult,
): Promise<MetaQueryResult> {
	const addonName = await getAddonName(addonId);
	if (rule.id !== 0 && rule.rule?.type === "COLOUR") {
		return {
			colour: new colour(rule.rule.value),
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
 * @param {Browser.tabs.Tab} tab - Target tab.
 * @param {MetaQueryResult} meta - Parsed tab metadata.
 * @returns {ApplyThemeResult} Theme cache payload when applied.
 */
function setFrameColour(
	tab: Browser.tabs.Tab,
	meta: MetaQueryResult,
): ApplyThemeResult {
	const windowId = tab.windowId;
	const correctionResult = meta.colour.contrastCorrection(
		cache.scheme,
		!pref.compatibilityMode && pref.allowDarkLight,
		pref.minContrast_light,
		pref.minContrast_dark,
	);
	const colour = correctionResult.colour;
	const scheme = correctionResult.scheme as Scheme;
	const corrected = correctionResult.corrected;
	pref.compatibilityMode
		? setTabThemeColour(tab, colour)
		: applyTheme(windowId, colour, scheme);
	const themeCache = {
		popupColour: colour
			.brightness((scheme === "light" ? -1.5 : 1) * pref.popup)
			.toRGBA(),
		scheme: scheme,
		corrected: corrected,
	};
	return themeCache;
}

/**
 * Applies theme colour to a tab using content script (compatibility mode).
 *
 * Used when the theme API is not supported or compatibility mode is enabled.
 *
 * @param {Browser.tabs.Tab} tab - Target tab.
 * @param {colour} colour - Colour to apply.
 * @returns {Promise<void>} Resolves when message delivery is attempted.
 */
async function setTabThemeColour(
	tab: Browser.tabs.Tab,
	colour: colour,
): Promise<void> {
	if (!tab.id) return;
	try {
		const message: MessageForTab = {
			header: "SET_THEME_COLOUR",
			colour: colour.brightness(pref.tabbar).toRGBA(),
		};
		await sendMessageToTab(tab.id, message);
	} catch (error) {
		console.warn("Could not apply theme colour to tab:", tab.url);
	}
}

/**
 * Applies a browser theme to a window.
 *
 * @param {number} windowId - Target browser window ID.
 * @param {colour} colour - Base colour.
 * @param {Scheme} scheme - Target colour scheme.
 * @returns {void}
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
 */
function applyTheme(windowId: number, colour: colour, scheme: Scheme): void {
	if (scheme === "light") {
		const textColour = "#000000";
		const secondaryColour = "#0000001c";
		const theme: Theme = {
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
		const theme: Theme = {
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
