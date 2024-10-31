/** Default light homepage colour */
export const default_homeBackground_light = "#FFFFFF";
/** Default dark homepage colour */
export const default_homeBackground_dark = "#2B2A33";
/** Default light fallback colours */
export const default_fallbackColour_light = "#FFFFFF";
/** Default dark fallback colour */
export const default_fallbackColour_dark = "#2B2A33";

/**
 * The default values of custom rules for web pages.
 *
 * reserved colour is a colour => uses the given colour as tab colour;
 *
 * reserved colour is IGNORE_THEME => sets calculated colour as tab colour;
 *
 * reserved colour is UN_IGNORE_THEME => sets theme colour as tab colour;
 *
 * reserved colour starts with QS_ => gets colour from the element found with the querySelector;
 */
export const default_customRule_webPage = Object.freeze({
	"apnews.com": "IGNORE_THEME",
	"developer.mozilla.org": "IGNORE_THEME",
	"www.facebook.com": "UN_IGNORE_THEME",
	"github.com": "IGNORE_THEME",
	"mail.google.com": "QS_div.wl",
	"open.spotify.com": "#000000",
	"www.linkedin.com": "IGNORE_THEME",
	"www.spiegel.de": "IGNORE_THEME",
});

/**
 * Colour for protected pages.
 */
export const default_protectedPageColour = Object.freeze({
	light: {
		"about:checkerboard": "DEFAULT",
		"about:debugging#": "rgb(255, 255, 255)",
		"about:devtools-toolbox": "rgb(255, 255, 255)",
		"about:firefoxview": "HOME",
		"about:home": "HOME",
		"about:newtab": "HOME",
		"about:performance": "DEFAULT",
		"about:plugins": "DEFAULT",
		"about:processes": "rgb(238, 238, 238)",
		"about:sync-log": "DEFAULT",
		"accounts-static.cdn.mozilla.net": "DEFAULT",
		"accounts.firefox.com": "rgb(250, 250, 253)",
		"addons.cdn.mozilla.net": "DEFAULT",
		"content.cdn.mozilla.net": "DEFAULT",
		"discovery.addons.mozilla.org": "rgb(236, 236, 236)",
		"install.mozilla.org": "DEFAULT",
		"support.mozilla.org": "rgb(255, 255, 255)",
	},
	dark: {
		"about:debugging#": "DEFAULT",
		"about:devtools-toolbox": "rgb(12, 12, 12)",
		"about:firefoxview": "HOME",
		"about:home": "HOME",
		"about:logo": "IMAGEVIEWER",
		"about:mozilla": "rgb(143, 15, 7)",
		"about:newtab": "HOME",
		"about:performance": "rgb(35, 34, 42)",
		"about:plugins": "rgb(43, 42, 50)",
		"about:privatebrowsing": "rgb(37, 0, 62)",
		"about:processes": "rgb(43, 42, 50)",
		"about:sync-log": "rgb(30, 30, 30)",
		"accounts-static.cdn.mozilla.net": "DEFAULT",
		"addons.cdn.mozilla.net": "DEFAULT",
		"addons.mozilla.org": "rgb(32, 18, 58)",
		"content.cdn.mozilla.net": "DEFAULT",
		"install.mozilla.org": "DEFAULT",
	},
});
/* 
To-do: use this in the future.
export const default_protectedPageColour = Object.freeze({
	// about:pages
	"about:checkerboard": { light: "DEFAULT", dark: undefined },
	"about:debugging": { light: "rgb(255, 255, 255)", dark: "DEFAULT" },
	"about:devtools-toolbox": { light: "rgb(255, 255, 255)", dark: "rgb(12, 12, 13)" },
	"about:firefoxview": { light: "HOME", dark: "HOME" },
	"about:home": { light: "HOME", dark: "HOME" },
	"about:newtab": { light: "HOME", dark: "HOME" },
	"about:performance": { light: "DEFAULT", dark: "rgb(35, 34, 42)" },
	"about:plugins": { light: "DEFAULT", dark: "rgb(43, 42, 50)" },
	"about:processes": { light: "rgb(238, 238, 238)", dark: "rgb(43, 42, 50)" },
	"about:sync-log": { light: "DEFAULT", dark: "rgb(30, 30, 30)" },
	// non-about:pages
	"accounts-static.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"accounts.firefox.com": { light: "rgb(250, 250, 253)", dark: undefined },
	"addons.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"content.cdn.mozilla.net": { light: "DEFAULT", dark: "DEFAULT" },
	"discovery.addons.mozilla.org": { light: "rgb(236, 236, 236)", dark: undefined },
	"install.mozilla.org": { light: "DEFAULT", dark: "DEFAULT" },
	"support.mozilla.org": { light: "rgb(255, 255, 255)", dark: undefined },
	"about:logo": { light: undefined, dark: "IMAGEVIEWER" },
	"about:mozilla": { light: undefined, dark: "rgb(143, 15, 7)" },
	"about:privatebrowsing": { light: undefined, dark: "rgb(37, 0, 62)" },
	"addons.mozilla.org": { light: undefined, dark: "rgb(32, 18, 58)" },
});
*/

/**
 * Recommended colours for Add-ons' built-in pages.
 * Contributions are welcomed.
 */
export const recommendedColour_addon = Object.freeze({
	"uBlock0@raymondhill.net": "#1b1a23",
	"adguardadblocker@adguard.com": "#131313",
	"{ce9f4b1f-24b8-4e9a-9051-b9e472b1b2f2}": "#fffffe",
	"enhancerforyoutube@maximerf.addons.mozilla.org": "#282a2d",
	"languagetool-webextension@languagetool.org": "#111113",
	"sponsorBlocker@ajay.app": "#323232",
	"tongwen@softcup": "#fffffe",
	"{46551EC9-40F0-4e47-8E18-8E5CF550CFB8}": "#fffffe",
	"{e7476172-097c-4b77-b56e-f56a894adca9}": "#151f2a",
});

/**
 * List of protected non-about:xxx domains.
 */
export const protectedDomain = Object.freeze({
	"accounts-static.cdn.mozilla.net": "PROTECTED",
	"accounts.firefox.com": "PROTECTED",
	"addons.cdn.mozilla.net": "PROTECTED",
	"addons.mozilla.org": "PROTECTED",
	"content.cdn.mozilla.net": "PROTECTED",
	"discovery.addons.mozilla.org": "PROTECTED",
	"install.mozilla.org": "PROTECTED",
	"support.mozilla.org": "PROTECTED",
});
