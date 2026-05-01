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
	plainTextExtension,
	presetAddonPageColour,
	sourcePageProtocol,
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
	getCurrentScheme,
	getSystemScheme,
	getWebExtName,
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
	ruleData: Record<number, RuleQueryResult | undefined>;
	metaData: Record<number, MetaQueryResult | undefined>;
	themeData: Record<number, ApplyThemeResult | undefined>;
	scheme: Scheme;
	readonly reversedScheme: Scheme;
	clear: () => Promise<void>;
} = {
	ruleData: {},
	metaData: {},
	themeData: {},
	scheme: "light",
	/** The reversed colour theme. */
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	/** Updates `scheme` and clears `ruleData`, `metaData`, and `themeData`. */
	async clear() {
		this.scheme = await getCurrentScheme();
		this.ruleData = {};
		this.metaData = {};
		this.themeData = {};
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
			const ruleData = cache.ruleData[windowId] ?? {
				id: 0,
				url: tab.url ?? "",
				rule: null,
			};
			const metaData = (cache.metaData[windowId] = parseTabColourData(
				message.colour,
				ruleData.rule,
			));
			const themeData = (cache.themeData[windowId] = setFrameColour(
				tab,
				metaData,
			));
			sendMessageToPopup({
				header: "CACHE_UPDATE",
				cache: { ruleData, metaData, themeData },
			});
			break;
		case "SCHEME_REQUEST":
			return getCurrentScheme();
		case "CACHE_REQUEST": {
			const windowId = await getWindowId(tab);
			if (windowId === undefined) return undefined;
			const ruleData = cache.ruleData[windowId];
			const metaData = cache.metaData[windowId];
			const themeData = cache.themeData[windowId];
			return ruleData && metaData && themeData
				? { ruleData, metaData, themeData }
				: undefined;
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
	const ruleData = (cache.ruleData[windowId] = await pref.getRule(tab.url));
	const metaData = (cache.metaData[windowId] = await getTabMeta(
		tab,
		ruleData,
	));
	const themeData = (cache.themeData[windowId] = setFrameColour(
		tab,
		metaData,
	));
	sendMessageToPopup({
		header: "CACHE_UPDATE",
		cache: { ruleData, metaData, themeData },
	});
}

/**
 * Gets colour metadata for a tab.
 *
 * @param {Browser.tabs.Tab} tab - Target tab.
 * @param {RuleQueryResult} ruleData - Rule query result for the tab URL.
 * @returns {Promise<MetaQueryResult>} Tab metadata.
 */
async function getTabMeta(
	tab: Browser.tabs.Tab,
	ruleData: RuleQueryResult,
): Promise<MetaQueryResult> {
	const { id, windowId, url, title, favIconUrl } = tab;

	if (!id) {
		console.warn("Failed to get tab ID of", url);
		return { colour: browserColour.FALLBACK, reason: "ERROR_OCCURRED" };
	} else if (!url || !URL.canParse(url)) {
		console.warn("Failed to get URL of tab", id);
		return { colour: browserColour.FALLBACK, reason: "ERROR_OCCURRED" };
	}

	const { hostname, href, pathname, protocol } = new URL(url);
	const { rule, webExtId } = ruleData;

	if (rule?.type === "COLOUR") {
		sendMessageToTab(id, { header: "SETUP_SCRIPT", mode: "suspend" }).catch(
			() => {},
		);

		if (rule.headerType === "URL") {
			return {
				colour: new colour(rule.value),
				reason: "COLOUR_SPECIFIED",
			};
		} else if (rule.headerType === "ADDON_ID") {
			const info = await getWebExtName(rule.header);
			if (info)
				return {
					colour: new colour(rule.value),
					reason: "ADDON_SPECIFIED",
					info,
				};
		}
	}

	try {
		return parseTabColourData(
			await sendMessageToTab<TabColourData>(id, {
				header: "SETUP_SCRIPT",
				mode: pref.dynamic ? "dynamic" : "static",
				query: rule?.type === "QUERY_SELECTOR" ? rule.value : undefined,
			}),
			rule,
		);
	} catch {
		console.info("Could not connect to", url);

		if (protocol === "about:")
			return await getAboutPageMeta(windowId, href, pathname, title);
		else if (protocol === "moz-extension:")
			return await getWebExtPageMeta(webExtId);
		else if (sourcePageProtocol.includes(protocol))
			return getSourcePageMeta(protocol, href);
		else if (href.startsWith("data:image"))
			return {
				colour: browserColour.IMAGE_VIEWER,
				reason: "IMAGE_VIEWER",
			};
		else if (href.endsWith(".pdf") || title?.endsWith(".pdf"))
			return { colour: browserColour.PDF_VIEWER, reason: "PDF_VIEWER" };
		else if (href.endsWith(".json") || title?.endsWith(".json"))
			return { colour: browserColour.JSON_VIEWER, reason: "JSON_VIEWER" };
		else if (favIconUrl?.startsWith("chrome:"))
			return { colour: browserColour.DEFAULT, reason: "PROTECTED_PAGE" };
		else if (href.match(new RegExp(`https?:\\/\\/${title}$`, "i")))
			return { colour: browserColour.PLAINTEXT, reason: "TEXT_VIEWER" };
		else if (hostname in mozillaPageColour)
			return {
				colour:
					mozillaPageColour[hostname]?.[cache.scheme] ??
					browserColour.FALLBACK,
				reason: "PROTECTED_PAGE",
			};
		else
			return {
				colour: browserColour.FALLBACK,
				reason: "FALLBACK_COLOUR",
			};
	}
}

/**
 * Parses raw tab colour data to determine final colour metadata.
 *
 * @param {TabColourData} tabColourData - Raw colour data extracted from the
 *   tab.
 * @param {Rule} rule - Matching rule for the tab.
 * @returns {MetaQueryResult} Tab metadata.
 */
function parseTabColourData(
	tabColourData: TabColourData,
	rule: Rule,
): MetaQueryResult {
	const { page, theme, query, special } = tabColourData;
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
		switch (special) {
			case "image":
				return browserColour.IMAGE_VIEWER;
			case "plaintext":
				return browserColour.PLAINTEXT;
			case "svg":
				return browserColour.SVG;
			default:
				return parsePageColour();
		}
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
					: { colour: getFallbackColour(), reason: "THEME_IGNORED" }
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
		default: {
			const themeColour = parseThemeColour();
			return themeColour.isOpaque()
				? !pref.noThemeColour
					? { colour: themeColour, reason: "THEME_USED" }
					: { colour: getFallbackColour(), reason: "THEME_IGNORED" }
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
		plainTextExtension.some((extension) => href.endsWith(extension))
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
 * @param {number} windowId - The window ID of the tab.
 * @param {string} href - Parsed tab href.
 * @param {string} pathname - Parsed tab pathname.
 * @param {string} [title] - Tab title.
 * @returns {Promise<MetaQueryResult>} Metadata of the about page tab.
 */
async function getAboutPageMeta(
	windowId: number,
	href: string,
	pathname: string,
	title?: string,
): Promise<MetaQueryResult> {
	if (
		["about:firefoxview", "about:home", "about:newtab"].some((homeHref) =>
			href.startsWith(homeHref),
		)
	) {
		return { colour: browserColour.HOME, reason: "HOME_PAGE" };
	} else if (href === "about:privatebrowsing") {
		return {
			colour: (await isWindowIncognito(windowId))
				? browserColour.PRIVATE
				: browserColour.DEFAULT,
			reason: "PROTECTED_PAGE",
		};
	} else if (
		href === "about:blank" &&
		title?.startsWith("about:") &&
		title?.endsWith("profile")
	) {
		return {
			colour: browserColour[
				aboutPageColour[title?.slice(6)] ?? "DEFAULT"
			],
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
 * @param {string} [webExtId] - Extension ID parsed from the page URL.
 * @returns {Promise<MetaQueryResult>} Metadata of the extension page.
 */
async function getWebExtPageMeta(webExtId?: string): Promise<MetaQueryResult> {
	if (webExtId !== undefined) {
		const webExtName =
			(await getWebExtName(webExtId)) ?? i18n.t("addonNotFound");
		const colour = presetAddonPageColour[webExtId]?.[cache.scheme];
		return colour !== undefined
			? { colour: colour, reason: "ADDON_PRESET", info: webExtName }
			: {
					colour: browserColour.ADDON,
					reason: "ADDON_DEFAULT",
					info: webExtName,
				};
	} else {
		return {
			colour: browserColour.ADDON,
			reason: "ADDON_DEFAULT",
			info: i18n.t("addonNotFound"),
		};
	}
}

/**
 * Applies the colour to the browser frame.
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
	const { colour, scheme, corrected } = meta.colour.contrastCorrection(
		cache.scheme,
		!pref.compatibilityMode && pref.allowDarkLight,
		pref.minContrast_light,
		pref.minContrast_dark,
	);
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
	} catch {
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
		properties: { color_scheme: "system", content_color_scheme: "system" },
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
