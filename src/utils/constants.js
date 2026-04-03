import { supportsThemeAPI } from "./utility.js";

/** The version of ATBC */
export const addonVersion = [4, 0];

/** Default light homepage colour */
export const default_homeBackground_light = "#ffffff";
/** Default dark homepage colour */
export const default_homeBackground_dark = "#2b2a33";
/** Default light fallback colours */
export const default_fallbackColour_light = "#ffffff";
/** Default dark fallback colour */
export const default_fallbackColour_dark = "#2b2a33";

/** Default compatibility mode setting */
export const default_compatibilityMode = !supportsThemeAPI();

/** Colours for about:pages. */
export const aboutPageColour = Object.freeze({
	checkerboard: { light: "DEFAULT", dark: undefined },
	deleteprofile: { light: "DEFAULT", dark: "#2b2a33" },
	"devtools-toolbox": { light: "DEFAULT", dark: "#0c0c0d" },
	editprofile: { light: "DEFAULT", dark: "#2b2a33" },
	firefoxview: { light: "HOME", dark: "HOME" },
	home: { light: "HOME", dark: "HOME" },
	logo: { light: undefined, dark: "IMAGEVIEWER" },
	mozilla: { light: undefined, dark: "#800000" },
	newtab: { light: "HOME", dark: "HOME" },
	newprofile: { light: "DEFAULT", dark: "#2b2a33" },
	performance: { light: "DEFAULT", dark: "#23222a" },
	plugins: { light: "DEFAULT", dark: "#2b2a33" },
	privatebrowsing: { light: undefined, dark: "#25003e" },
	processes: { light: "#eeeeee", dark: "#32313a" },
	"sync-log": { light: "#ececec", dark: "#282828" },
});

/** Colours for restricted sites. */
export const mozillaPageColour = Object.freeze({
	"accounts-static.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"accounts.firefox.com": { light: "#fafafd", dark: undefined },
	"addons.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"addons.mozilla.org": { light: undefined, dark: "#20123a" },
	"content.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"discovery.addons.mozilla.org": { light: "#ececec", dark: undefined },
	"install.mozilla.org": { light: "DEFAULT", dark: "DEFAULT" },
	"support.mozilla.org": { light: "#ffffff", dark: undefined },
});

// prettier-ignore
/**
 * Preset colours for Add-ons' built-in pages.
 *
 * Contributions are welcomed.
 */
export const presetAddonPageColour = Object.freeze({
	"addon@darkreader.org": { light: undefined, dark: "#141e24" }, // Dark Reader
	"adguardadblocker@adguard.com": { light: "#ffffff", dark: "#1f1f1f" }, // AdGuard AdBlocker
	"copyplaintext@eros.man": { light: "#ffffff", dark: "#000000" }, // Copy PlainText
	"deArrow@ajay.app": { light: undefined, dark: "#333333" }, // DeArrow
	"enhancerforyoutube@maximerf.addons.mozilla.org": { light: "#eeeeee", dark: "#292a2d"}, // Enhancer for YouTube™
	"gdpr@cavi.au.dk": { light: undefined, dark: "#00237a" }, // Consent-O-Matic
	"jid1-KdTtiCj6wxVAFA@jetpack": { light: "#f9f9f8", dark: "#171a18" }, // Swift Selection Search
	"sponsorBlocker@ajay.app": { light: undefined, dark: "#333333" }, // SponsorBlock for YouTube
	"uBlock0@raymondhill.net": { light: "#f0f0f2", dark: "#1b1b24" }, // uBlock Origin
	"{1018e4d6-728f-4b20-ad56-37578a4de76b}": { light: "#ffffff", dark: undefined }, // Flagfox
	"{74145f27-f039-47ce-a470-a662b129930a}": { light: undefined, dark: "#343a40" }, // ClearURLs
	"{7a7a4a92-a2a0-41d1-9fd7-1e92480d612d}": { light: "#ffffff", dark: "#242424" }, // Stylus
	"{a8cf72f7-09b7-4cd4-9aaa-7a023bf09916}": { light: undefined, dark: "#191919" }, // Time Tracker
	"{aecec67f-0d10-4fa7-b7c7-609a2db280cf}": { light: "#ffffff", dark: "#262626" }, // Violentmonkey
	"{ce9f4b1f-24b8-4e9a-9051-b9e472b1b2f2}": { light: "#ffffff", dark: "#1c1b1f" }, // Clear Browsing Data
});

/** Default content of the preference */
export const defaultPref = Object.freeze({
	// theme builder
	tabbar: 0,
	tabbarBorder: 0,
	tabSelected: 15,
	tabSelectedBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	sidebar: 5,
	sidebarBorder: 5,
	popup: 5,
	popupBorder: 5,
	// rule list
	ruleList: {},
	// advanced
	minContrast_light: 90,
	minContrast_dark: 45,
	allowDarkLight: true,
	dynamic: true,
	noThemeColour: true,
	compatibilityMode: default_compatibilityMode,
	homeBackground_light: default_homeBackground_light,
	homeBackground_dark: default_homeBackground_dark,
	fallbackColour_light: default_fallbackColour_light,
	fallbackColour_dark: default_fallbackColour_dark,
	// state
	version: addonVersion,
	lastSave: 0,
});
