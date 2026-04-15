/*
 * System colour scheme:
 * The colour scheme of the operating system, usually light or dark.
 *
 * Browser colour scheme:
 * The "website appearance" settings of Firefox, which can be light, dark, or auto.
 *
 * `cache.scheme`:
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
import colour from "@/utils/colour";
import {
	aboutPageColour,
	mozillaPageColour,
	presetAddonPageColour,
} from "@/utils/constants";
import preference from "@/utils/preference";
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
} from "@/utils/types";
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
} from "@/utils/utility";

/** Preference instance. */
const pref = new preference();

/** Page colour of Firefox internal page. */
const browserColour: Record<BrowserColour, colour> = Object.freeze({
	get ADDON() {
		return cache.scheme === "light"
			? new colour("#ececec")
			: new colour("#323232");
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
			? new colour("#f9f9f8")
			: new colour("#0c0c0d");
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
			? new colour("#f9f9f8")
			: new colour("#38383d");
	},
	get PLAINTEXT() {
		return cache.scheme === "light"
			? new colour("#ffffff")
			: new colour("#1c1b22");
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
	get SVG() {
		return new colour("#ffffff");
	},
	get SYSTEM() {
		return cache.scheme === "light"
			? new colour("#ececec")
			: new colour("#282828");
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
			if (tab === undefined || !tab.active) break;
			updateTab(tab);
			break;
		case "UPDATE_COLOUR":
			if (tab === undefined || !tab.active) break;
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
			return getCurrentScheme();
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
 * Gets colour metadata for a tab.
 *
 * @param {Browser.tabs.Tab} tab - Target browser tab.
 * @param {Rule} rule - Matched rule for the tab URL.
 * @returns {Promise<MetaQueryResult>} Metadata used for theme application.
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
		return getProtectedPageMeta(tab);
	};

	if (!tab.id) return getFallbackMeta();
	try {
		const tabColour = await sendMessageToTab<TabColourData>(tab.id, {
			header: "GET_COLOUR",
			dynamic: rule?.type === "COLOUR" ? false : pref.dynamic,
			query: rule?.type === "QUERY_SELECTOR" ? rule.value : undefined,
		});
		return parseTabColour(tabColour, rule);
	} catch (error) {
		return getFallbackMeta();
	}
}

function parseTabColour(
	{ page, theme, query, special }: TabColourData,
	rule: Rule,
): MetaQueryResult {
	const parsePageColour = () => {
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
	const parseThemeColour = () => new colour(theme[cache.scheme]);
	const parseQueryColour = () => new colour(query?.colour);
	const getFallbackColour = () => {
		if (special === "image") return browserColour.IMAGE_VIEWER;
		else if (special === "plaintext") return browserColour.PLAINTEXT;
		else if (special === "svg") return browserColour.SVG;
		else return parsePageColour();
	};

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
							colour: getFallbackColour(),
							reason: "THEME_IGNORED",
						}
				: {
						colour: getFallbackColour(),
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
						colour: getFallbackColour(),
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
		default: {
			const themeColour = parseThemeColour();
			return themeColour.isOpaque()
				? !pref.noThemeColour
					? {
							colour: themeColour,
							reason: "THEME_USED",
						}
					: {
							colour: getFallbackColour(),
							reason: "THEME_IGNORED",
						}
				: {
						colour: getFallbackColour(),
						reason:
							special === "image" || special === "svg"
								? "IMAGE_VIEWER"
								: special === "plaintext"
									? "TEXT_VIEWER"
									: "COLOUR_PICKED",
					};
		}
	}
}

/**
 * Gets colour metadata for protected and internal pages.
 *
 * @param {Browser.tabs.Tab} tab - Target tab.
 * @returns {Promise<MetaQueryResult>} Metadata for the page.
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
	const hostname = url.hostname;
	const href = url.href;
	const protocol = url.protocol;
	const title = tab.title ?? "";
	if (protocol === "about:") {
		return await getAboutPageMeta(tab, url, title);
	} else if (protocol === "moz-extension:") {
		return await getAddonPageMeta(tab, href);
	} else if (
		["view-source:", "chrome:", "resource:", "jar:"].includes(protocol)
	) {
		return getSourcePageMeta(protocol, href);
	} else if (href.startsWith("data:image")) {
		return {
			colour: browserColour.IMAGE_VIEWER,
			reason: "IMAGE_VIEWER",
		};
	} else if (href.endsWith(".pdf") || title.endsWith(".pdf")) {
		return { colour: browserColour.PDF_VIEWER, reason: "PDF_VIEWER" };
	} else if (href.endsWith(".json") || title.endsWith(".json")) {
		return { colour: browserColour.JSON_VIEWER, reason: "JSON_VIEWER" };
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
 * Gets the colour metadata for source pages.
 *
 * @param {string} protocol - The page protocol.
 * @param {string} href - The full page URL.
 * @returns {MetaQueryResult} Metadata of the source page.
 */
function getSourcePageMeta(protocol: string, href: string): MetaQueryResult {
	const reason = "PROTECTED_PAGE";
	if (
		protocol === "view-source:" ||
		[".txt", ".css", ".mjs", ".js", ".ftl", ".locale"].some((extension) =>
			href.endsWith(extension),
		)
	) {
		return { colour: browserColour.PLAINTEXT, reason };
	} else if ([".png", ".jpg"].some((extension) => href.endsWith(extension))) {
		return { colour: browserColour.IMAGE_VIEWER, reason };
	} else if (href.endsWith(".svg")) {
		return { colour: browserColour.SVG, reason };
	} else return { colour: browserColour.SYSTEM, reason };
}

/**
 * Gets colour metadata for an about page.
 *
 * @param {Browser.tabs.Tab} tab - The protected about page tab.
 * @param {URL} url - Parsed tab URL.
 * @param {string} title - Tab title.
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
 * @returns {Promise<MetaQueryResult>} Metadata of the extension page.
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
	if (scheme !== "light" && scheme !== "dark") return;
	const factor = scheme === "light" ? -1.5 : 1;
	const textColour = scheme === "light" ? "#000000" : "#ffffff";
	const secondaryColour = scheme === "light" ? "#0000001c" : "#ffffff1c";
	const css = (value: number): string =>
		colour.brightness(factor * value).toRGBA();
	const theme: Theme = {
		colors: {
			// adaptive
			button_background_active: css(pref.tabSelected),
			frame: css(pref.tabbar),
			frame_inactive: css(pref.tabbar),
			ntp_background: browserColour.HOME.toRGBA(),
			popup: css(pref.popup),
			popup_border: css(pref.popup + pref.popupBorder),
			sidebar: css(pref.sidebar),
			sidebar_border: css(pref.sidebar + pref.sidebarBorder),
			tab_line: css(pref.tabSelectedBorder + pref.tabSelected),
			tab_selected: css(pref.tabSelected),
			toolbar: css(pref.toolbar),
			toolbar_bottom_separator: css(pref.toolbarBorder + pref.toolbar),
			toolbar_field: css(pref.toolbarField),
			toolbar_field_border: css(
				pref.toolbarFieldBorder + pref.toolbarField,
			),
			toolbar_field_focus: css(pref.toolbarFieldOnFocus),
			toolbar_top_separator:
				pref.tabbarBorder === 0
					? "transparent"
					: css(pref.tabbarBorder + pref.tabbar),
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
