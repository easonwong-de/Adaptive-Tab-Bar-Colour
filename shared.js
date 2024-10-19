/** Default light homepage colour */
export const default_homeBackground_light = "#FFFFFF";
/** Default dark homepage colour */
export const default_homeBackground_dark = "#2B2A33";
/** Default light fallback colours */
export const default_fallbackColour_light = "#FFFFFF";
/** Default dark fallback colour */
export const default_fallbackColour_dark = "#2B2A33";

/**
 * The default values of reserved colours;
 *
 * reserved colour is a colour => uses the given colour as tab colour;
 *
 * reserved colour is IGNORE_THEME => sets calculated colour as tab colour;
 *
 * reserved colour is UN_IGNORE_THEME => sets theme colour as tab colour;
 *
 * reserved colour starts with QS_ => gets colour from the element found with the querySelector;
 */
export const default_reservedColour = Object.freeze({
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
 * Colour of pages where content script can't be injected.
 *
 * url listed only in "light/dark" => only use that colour regardless of the colour scheme (there is one colour scheme for the page);
 *
 * url listed in both => choose colour scheme as needed (there is a light and a dark version of the page);
 *
 * url listed as "DEFAULT" => use default light / dark Firefox colours.
 *
 * url listed as "HOME" => use homepage colour;
 *
 * url listed as "IMAGEVIEWER" => use image viewer theme;
 */
export const reservedColour_aboutPage = Object.freeze({
	light: {
		"about:checkerboard": "DEFAULT",
		"about:debugging#": "rgb(236, 236, 236)",
		"about:devtools-toolbox": "rgb(249, 249, 250)",
		"about:firefoxview": "HOME",
		"about:home": "HOME",
		"about:newtab": "HOME",
		"about:performance": "DEFAULT",
		"about:plugins": "DEFAULT",
		"about:processes": "rgb(239, 239, 242)",
		"about:sync-log": "DEFAULT",
		"accounts-static.cdn.mozilla.net": "DEFAULT",
		"accounts.firefox.com": "rgb(251, 251, 254)",
		"addons.cdn.mozilla.net": "DEFAULT",
		"content.cdn.mozilla.net": "DEFAULT",
		"discovery.addons.mozilla.org": "rgb(236, 236, 236)",
		"install.mozilla.org": "DEFAULT",
		"support.mozilla.org": "rgb(255, 255, 255)",
	},
	dark: {
		"about:debugging#": "DEFAULT",
		"about:devtools-toolbox": "rgb(12, 12, 13)",
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

/**
 * Legacy pref keys and their current version.
 */
export const legacyPrefKey = Object.freeze({
	force: "allowDarkLight",
	tabbar_color: "tabbar",
	tab_selected_color: "tabSelected",
	toolbar_color: "toolbar",
	separator_opacity: "toolbarBorderBottom",
	toolbar_field_color: "toolbarField",
	toolbar_field_focus_color: "toolbarFieldOnFocus",
	sidebar_color: "sidebar",
	sidebar_border_color: "sidebarBorder",
	popup_color: "popup",
	popup_border_color: "popupBorder",
	light_color: "homeBackground_light",
	dark_color: "homeBackground_dark",
	light_fallback_color: "fallbackColour_light",
	dark_fallback_color: "fallbackColour_dark",
	reservedColour_cs: "reservedColour",
	last_version: "version",
});

/**
 * @returns Firefox version. 0 if cannot be found.
 */
export function checkVersion() {
	let userAgent = navigator.userAgent;
	let version = 0;
	let ind = userAgent.lastIndexOf("Firefox");
	if (ind != -1) version = userAgent.substring(ind + 8);
	return version;
}
