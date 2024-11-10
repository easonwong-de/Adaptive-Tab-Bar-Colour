"use strict";

/** Default light homepage colour */
export const default_homeBackground_light = "#FFFFFF";
/** Default dark homepage colour */
export const default_homeBackground_dark = "#2B2A33";
/** Default light fallback colours */
export const default_fallbackColour_light = "#FFFFFF";
/** Default dark fallback colour */
export const default_fallbackColour_dark = "#2B2A33";

/**
 * Colours for about:pages.
 */
export const default_aboutPageColour = Object.freeze({
	checkerboard: { light: "DEFAULT", dark: undefined },
	"devtools-toolbox": { light: "DEFAULT", dark: "rgb(12, 12, 13)" },
	firefoxview: { light: "HOME", dark: "HOME" },
	home: { light: "HOME", dark: "HOME" },
	logo: { light: undefined, dark: "IMAGEVIEWER" },
	mozilla: { light: undefined, dark: "rgb(143, 15, 7)" },
	newtab: { light: "HOME", dark: "HOME" },
	performance: { light: "DEFAULT", dark: "rgb(35, 34, 42)" },
	plugins: { light: "DEFAULT", dark: "rgb(43, 42, 50)" },
	privatebrowsing: { light: undefined, dark: "rgb(37, 0, 62)" },
	processes: { light: "rgb(238, 238, 238)", dark: "rgb(43, 42, 50)" },
	"sync-log": { light: "rgb(236, 236, 236)", dark: "rgb(40, 40, 40)" },
});

/**
 * Colours for protected pages.
 */
export const default_protectedPageColour = Object.freeze({
	"accounts-static.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"accounts.firefox.com": { light: "rgb(250, 250, 253)", dark: undefined },
	"addons.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"addons.mozilla.org": { light: undefined, dark: "rgb(32, 18, 58)" },
	"content.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"discovery.addons.mozilla.org": { light: "rgb(236, 236, 236)", dark: undefined },
	"install.mozilla.org": { light: "DEFAULT", dark: "DEFAULT" },
	"support.mozilla.org": { light: "rgb(255, 255, 255)", dark: undefined },
});

/**
 * Recommended colours for Add-ons' built-in pages.
 * Contributions are welcomed.
 */
export const recommendedColour_addon = Object.freeze({
	"adguardadblocker@adguard.com": "#131313",
	"enhancerforyoutube@maximerf.addons.mozilla.org": "#282a2d",
	"languagetool-webextension@languagetool.org": "#111113",
	"sponsorBlocker@ajay.app": "#323232",
	"tongwen@softcup": "#fffffe",
	"uBlock0@raymondhill.net": "#1b1a23",
	"{46551EC9-40F0-4e47-8E18-8E5CF550CFB8}": "#fffffe",
	"{ce9f4b1f-24b8-4e9a-9051-b9e472b1b2f2}": "#fffffe",
	"{e7476172-097c-4b77-b56e-f56a894adca9}": "#151f2a",
});
