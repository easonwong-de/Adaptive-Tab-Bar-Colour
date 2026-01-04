import { supportsThemeAPI } from "./utility.js";

/** The version of ATBC */
export const addonVersion = [3, 2];

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

/**
 * Recommended colours for Add-ons' built-in pages.
 *
 * Contributions are welcomed.
 *
 * @todo Adds light / dark attributes.
 */
export const recommendedAddonPageColour = Object.freeze({
	"addon@darkreader.org": "#141e24", // Dark Reader
	"adguardadblocker@adguard.com": "#1f1f1f", // AdGuard AdBlocker
	"deArrow@ajay.app": "#333333", // DeArrow
	"enhancerforyoutube@maximerf.addons.mozilla.org": "#292a2d", // Enhancer for YouTube™
	"languagetool-webextension@languagetool.org": "#111213", // LanguageTool
	"sponsorBlocker@ajay.app": "#333333", // SponsorBlock for YouTube
	"uBlock0@raymondhill.net": "#1b1b24", // uBlock Origin
	"{036a55b4-5e72-4d05-a06c-cba2dfcc134a}": "#171a1b", // Translate Web Pages
	"{7a7a4a92-a2a0-41d1-9fd7-1e92480d612d}": "#242424", // Stylus
	"{aecec67f-0d10-4fa7-b7c7-609a2db280cf}": "#262626", // Violentmonkey
	"{ce9f4b1f-24b8-4e9a-9051-b9e472b1b2f2}": "#1c1b1f", // Clear Browsing Data
});

/** Default content of the preference */
export const defaultPreference = Object.freeze({
	tabbar: 0,
	tabbarBorder: 0,
	tabSelected: 10,
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
	siteList: {},
	version: addonVersion,
});
