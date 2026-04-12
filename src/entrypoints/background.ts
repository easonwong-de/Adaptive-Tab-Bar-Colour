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
import colour from "@/utils/colour.js";
import preference from "@/utils/preference.js";
import {
	aboutPageColour,
	mozillaPageColour,
	presetAddonPageColour,
} from "@/utils/constants.js";
import type {
	ApplyThemeResult,
	BrowserColour,
	MessageForBackground,
	MetaQueryResult,
	Rule,
	RuleQueryResult,
	Scheme,
	TabColourData,
	Theme,
} from "@/utils/types.js";
import {
	addMessageListener,
	addSchemeChangeListener,
	addTabChangeListener,
	getActiveTabList,
	getAddonId,
	getAddonName,
	getCurrentScheme,
	getSystemScheme,
	getWindowId,
	isWindowIncognito,
	sendMessageToPopup,
	sendMessageToTab,
	updateBrowserTheme,
} from "@/utils/utility.js";

/** Preference instance. */
const pref = new preference();

/** Page colour of Firefox internal page. */
const browserColour: Record<BrowserColour, colour> = Object.freeze({
	get ADDON() {
		return cache.scheme === "light"
			? new colour().rgba(236, 236, 236, 1)
			: new colour().rgba(50, 50, 50, 1);
	},
	get COMPAT() {
		return cache.scheme === "light"
			? new colour("#ffffff")
			: new colour("#292833");
	},
	get DEFAULT() {
		return cache.scheme === "light"
			? new colour("#ffffff")
			: new colour("#1c1b22");
	},
	get FALLBACK() {
		return cache.scheme === "light"
			? new colour(pref.fallbackColour_light)
			: new colour(pref.fallbackColour_dark);
	},
	get HOME() {
		return cache.scheme === "light"
			? new colour(pref.homeBackground_light)
			: new colour(pref.homeBackground_dark);
	},
	get IMAGE_VIEWER() {
		return new colour("#212121");
	},
	get JSON_VIEWER() {
		return getSystemScheme() === "light"
			? new colour().rgba(249, 249, 250, 1)
			: new colour().rgba(12, 12, 13, 1);
	},
	get LOG() {
		return cache.scheme === "light"
			? new colour("#ececec")
			: new colour("#282828");
	},
	get MOTTO() {
		return new colour("#800000");
	},
	get PDF_VIEWER() {
		return cache.scheme === "light"
			? new colour().rgba(249, 249, 250, 1)
			: new colour().rgba(56, 56, 61, 1);
	},
	get PLAINTEXT() {
		return cache.scheme === "light"
			? new colour().rgba(255, 255, 255, 1)
			: new colour().rgba(28, 27, 34, 1);
	},
	get PRIVATE() {
		return new colour("#25003e");
	},
	get PROCESS() {
		return cache.scheme === "light"
			? new colour("#eeeeef")
			: new colour("#32313a");
	},
	get PROFILE() {
		return cache.scheme === "light"
			? new colour("#ffffff")
			: new colour("#2b2a33");
	},
	get SYSTEM() {
		return cache.scheme === "light"
			? new colour().rgba(255, 255, 255, 1)
			: new colour().rgba(30, 30, 30, 1);
	},
	get TOOLBOX() {
		return getSystemScheme() === "light"
			? new colour("#ffffff")
			: new colour("#232327");
	},
});

/** Runtime cache. */
const cache: {
	rule: Record<number, RuleQueryResult | undefined>;
	meta: Record<number, MetaQueryResult | undefined>;
	theme: Record<number, ApplyThemeResult | undefined>;
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
	switch (message.header) {
		case "SCRIPT_READY":
			if (tab === undefined) break;
			updateTab(tab);
			break;
		case "UPDATE_COLOUR":
			if (tab === undefined) break;
			const windowId = tab.windowId;
			const rule = cache.rule[windowId];
			const meta = (cache.meta[windowId] = parseTabColour(
				message.colour,
				rule?.rule ?? null,
			));
			cache.theme[windowId] = setFrameColour(tab, meta);
			sendMessageToPopup({ header: "CACHE_UPDATE" });
			break;
		case "SCHEME_REQUEST":
			return await getCurrentScheme();
		case "CACHE_REQUEST": {
			const windowId = await getWindowId(tab);
			if (windowId === undefined) return undefined;
			const rule = cache.rule[windowId];
			const meta = cache.meta[windowId];
			const theme = cache.theme[windowId];
			if (!rule || !meta || !theme) return undefined;
			return { rule, meta, theme };
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
	const rule = (cache.rule[windowId] = pref.getRule(tab.url));
	const meta = (cache.meta[windowId] = await getTabMeta(tab, rule.rule));
	cache.theme[windowId] = setFrameColour(tab, meta);
	sendMessageToPopup({ header: "CACHE_UPDATE" });
}

/**
 * Determines the appropriate colour metadata for a tab.
 *
 * @param {Browser.tabs.Tab} tab - Target browser tab.
 * @param {Rule} rule - Matched rule for the tab URL.
 * @returns {Promise<MetaQueryResult>} Resolved metadata used for theme
 *   application.
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
		const tabColour = await sendMessageToTab<TabColourData>(tab.id, {
			header: "GET_COLOUR",
			dynamic: rule?.type === "COLOUR" ? false : pref.dynamic,
			query: rule?.type === "QUERY_SELECTOR" ? rule.value : undefined,
		});
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
	{ theme, page, query, image, plaintext }: TabColourData,
	rule: Rule,
): MetaQueryResult {
	const parseThemeColour = () => new colour(theme[cache.scheme]);
	const parsePageColour = () => {
		if (image) return browserColour.IMAGE_VIEWER;
		if (plaintext) return browserColour.PLAINTEXT;
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
				? !pref.noThemeColour
					? {
							colour: themeColour,
							reason: "THEME_USED",
						}
					: {
							colour: parsePageColour(),
							reason: "THEME_IGNORED",
						}
				: {
						colour: parsePageColour(),
						reason: image
							? "IMAGE_VIEWER"
							: plaintext
								? "TEXT_VIEWER"
								: "COLOUR_PICKED",
					};
	}
}

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
	const hostname = url.hostname;
	const href = url.href;
	const protocol = url.protocol;
	const title = tab.title ?? "";
	if (protocol === "about:") {
		return await getAboutPageMeta(tab, url, title);
	} else if (protocol === "moz-extension:") {
		return await getAddonPageMeta(tab, href);
	} else if (
		["view-source:", "chrome:", "resource:", "jar:file:"].includes(protocol)
	) {
		return getSourcePageMeta(protocol, href);
	} else if (href.startsWith("data:image")) {
		return {
			colour: browserColour.IMAGE_VIEWER,
			reason: "IMAGE_VIEWER",
		};
	} else if (href.endsWith(".pdf") || title.endsWith(".pdf")) {
		return {
			colour: browserColour.PDF_VIEWER,
			reason: "PDF_VIEWER",
		};
	} else if (href.endsWith(".json") || title.endsWith(".json")) {
		return {
			colour: browserColour.JSON_VIEWER,
			reason: "JSON_VIEWER",
		};
	} else if (tab.favIconUrl?.startsWith("chrome:")) {
		return {
			colour: browserColour.DEFAULT,
			reason: "PROTECTED_PAGE",
		};
	} else if (href.match(new RegExp(`https?:\\/\\/${title}$`, "i"))) {
		return {
			colour: browserColour.PLAINTEXT,
			reason: "TEXT_VIEWER",
		};
	} else if (hostname in mozillaPageColour) {
		const colour =
			mozillaPageColour[hostname]?.[cache.scheme] ??
			browserColour.FALLBACK;
		return {
			colour: colour,
			reason: "PROTECTED_PAGE",
		};
	} else {
		return {
			colour: browserColour.FALLBACK,
			reason: "FALLBACK_COLOUR",
		};
	}
}

/**
 * Determines the colour metadata for source pages.
 *
 * @param {string} protocol - The page protocol.
 * @param {string} href - The full page URL.
 * @returns {MetaQueryResult} Metadata of the source page.
 */
function getSourcePageMeta(protocol: string, href: string): MetaQueryResult {
	if (protocol === "view-source:") {
		return {
			colour: browserColour.PLAINTEXT,
			reason: "PROTECTED_PAGE",
		};
	} else if (
		[".txt", ".css", ".jsm", ".js"].some((extention) =>
			href.endsWith(extention),
		)
	) {
		return {
			colour: browserColour.PLAINTEXT,
			reason: "PROTECTED_PAGE",
		};
	} else if ([".png", ".jpg"].some((extention) => href.endsWith(extention))) {
		return {
			colour: browserColour.IMAGE_VIEWER,
			reason: "PROTECTED_PAGE",
		};
	} else {
		return {
			colour: browserColour.SYSTEM,
			reason: "PROTECTED_PAGE",
		};
	}
}

/**
 * Determines the colour metadata for an about page.
 *
 * @param {Browser.tabs.Tab} tab - The protected about page tab.
 * @returns {Promise<MetaQueryResult>} Metadata of the about page tab.
 */
async function getAboutPageMeta(
	tab: Browser.tabs.Tab,
	url: URL,
	title: string,
): Promise<MetaQueryResult> {
	const href = url.href;
	const pathname = url.pathname;
	if (
		["about:firefoxview", "about:home", "about:newtab"].some((homeHref) =>
			href.startsWith(homeHref),
		)
	) {
		return { colour: browserColour.HOME, reason: "HOME_PAGE" };
	} else if (href === "about:privatebrowsing") {
		return {
			colour: (await isWindowIncognito(tab))
				? browserColour.PRIVATE
				: browserColour.DEFAULT,
			reason: "PROTECTED_PAGE",
		};
	} else if (
		href === "about:blank" &&
		title.startsWith("about:") &&
		title.endsWith("profile")
	) {
		return {
			colour: browserColour[aboutPageColour[title.slice(6)] ?? "DEFAULT"],
			reason: "PROTECTED_PAGE",
		};
	} else {
		return {
			colour: browserColour[aboutPageColour[pathname] ?? "DEFAULT"],
			reason: "PROTECTED_PAGE",
		};
	}
}

/**
 * Gets the colour metadata for an extension page.
 *
 * @param {Browser.tabs.Tab} tab - The extension tab.
 * @param {string} href - The extension page URL.
 * @returns {Promise<MetaQueryResult>} Metadata for the extension page.
 */
async function getAddonPageMeta(
	tab: Browser.tabs.Tab,
	href: string,
): Promise<MetaQueryResult> {
	const addonId = await getAddonId(href);
	if (addonId) {
		const ruleQueryResult = pref.getRule(addonId);
		cache.rule[tab.windowId] = ruleQueryResult;
		const addonName = await getAddonName(addonId);
		if (
			ruleQueryResult.id !== 0 &&
			ruleQueryResult.rule?.type === "COLOUR"
		) {
			return {
				colour: new colour(ruleQueryResult.rule.value),
				reason: "ADDON_SPECIFIED",
				info: addonName,
			};
		} else {
			const colour = presetAddonPageColour[addonId]?.[cache.scheme];
			return colour !== undefined
				? {
						colour: colour,
						reason: "ADDON_PRESET",
						info: addonName,
					}
				: {
						colour: browserColour.ADDON,
						reason: "ADDON_DEFAULT",
						info: addonName,
					};
		}
	} else {
		cache.rule[tab.windowId] = { id: 0, query: "", rule: null };
		return {
			colour: browserColour.ADDON,
			reason: "ADDON_DEFAULT",
			info: i18n.t("addonNotFound"),
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
	return {
		popupColour: colour
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
		await sendMessageToTab(tab.id, {
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
