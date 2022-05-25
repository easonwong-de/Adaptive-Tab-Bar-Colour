var adaptive_themes = {
  "light": {
    colors: {
      //Theme colors
      frame: "rgb(255, 255, 255)",
      frame_inactive: "rgb(255, 255, 255)",
      popup: "rgb(255, 255, 255)",
      ntp_background: "rgb(255, 255, 255)",
      toolbar_field: "rgb(242, 242, 242)",
      toolbar_field_focus: "rgb(242, 242, 242)",
      //Texts and icons
      toolbar_text: "rgb(0, 0, 0)",
      toolbar_field_text: "rgba(0, 0, 0)",
      popup_text: "rgb(0, 0, 0)",
      ntp_text: "rgb(0, 0, 0)",
      tab_background_text: "rgb(30, 30, 30)",
      icons: "rgb(30, 30, 30)",
      //Hovered and active
      tab_selected: "rgba(0, 0, 0, 0.15)",
      button_background_active: "rgba(0, 0, 0, 0.15)",
      button_background_hover: "rgba(0, 0, 0, 0.10)",
      toolbar_field_border_focus: "rgb(130, 180, 245)",
      //Hidden
      toolbar: "rgba(0, 0, 0, 0)",
      tab_line: "rgba(0, 0, 0, 0)",
      popup_border: "rgba(0, 0, 0, 0)",
      sidebar_border: "rgba(0, 0, 0, 0)",
      toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
      toolbar_top_separator: "rgba(0, 0, 0, 0)",
      tab_loading: "rgba(0, 0, 0, 0)",
    }
  },
  "dark": {
    colors: {
      //Theme colors
      frame: "rgb(28, 27, 34)",
      frame_inactive: "rgb(28, 27, 34)",
      popup: "rgb(28, 27, 34)",
      ntp_background: "rgb(28, 27, 34)",
      toolbar_field: "rgb(39, 38, 45)",
      toolbar_field_focus: "rgb(39, 38, 45)",
      ////Texts and icons
      toolbar_text: "rgb(255, 255, 255)",
      toolbar_field_text: "rgb(255, 255, 255)",
      popup_text: "rgb(225, 225, 225)",
      ntp_text: "rgb(255, 255, 255)",
      tab_background_text: "rgb(225, 225, 225)",
      icons: "rgb(225, 225, 225)",
      //Hovered and active
      tab_selected: "rgba(255, 255, 255, 0.15)",
      button_background_active: "rgba(255, 255, 255, 0.15)",
      button_background_hover: "rgba(255, 255, 255, 0.10)",
      toolbar_field_border_focus: "rgb(70, 118, 160)",
      //Hidden
      toolbar: "rgba(0, 0, 0, 0)",
      tab_line: "rgba(0, 0, 0, 0)",
      popup_border: "rgba(0, 0, 0, 0)",
      sidebar_border: "rgba(0, 0, 0, 0)",
      toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
      toolbar_top_separator: "rgba(0, 0, 0, 0)",
      tab_loading: "rgba(0, 0, 0, 0)",
    }
  }
};

//Pages where content script can't be injected
//other reserved color are in content_script.js
//url listed only in "light"/"dark" => only in light/dark mode
//url listed in both => choose color scheme as needed
//url listed as "DEFAULT" => use default_light/dark_color
const reservedColor = {
  "light": {
    "about:checkerboard": "DEFAULT",
    "about:debugging#": "rgb(249, 249, 250)",
    "about:devtools-toolbox": "rgb(249, 249, 250)",
    "about:performance": "DEFAULT",
    "about:plugins": "DEFAULT",
    "about:processes": "rgb(239, 239, 242)",
    "about:sync-log": "DEFAULT"
  },
  "dark": {
    "about:debugging#": "DEFAULT",
    "about:devtools-toolbox": "rgb(12, 12, 13)",
    "about:logo": "rgb(33, 33, 33)",
    "about:mozilla": "rgb(143, 15, 7)",
    "about:performance": "rgb(35, 34, 42)",
    "about:plugins": "rgb(43, 42, 50)",
    "about:privatebrowsing": "rgb(37, 0, 62)",
    "about:processes": "rgb(43, 42, 50)",
    "about:sync-log": "rgb(30, 30, 30)",
    "addons.mozilla.org": "rgb(32, 18, 58)"
  }
}

//Settings cache
var default_light_color = "#FFFFFF";
var default_dark_color = "#1C1B22";
var scheme;
var force = false;
var pref_custom;
var pref_light_color;
var pref_dark_color;

//Fired when the extension is first installed
//when the extension is updated to a new version
//and when the browser is updated to a new version
browser.runtime.onInstalled.addListener(init);

/**
 * Initializes the settings, then opens options page.
 */
function init() {
  //browser.storage.local.set({force: true}); //v1.3.1 temporary fix
  browser.storage.local.get(function (pref) {
    scheme = pref.scheme;
    force = pref.force;
    pref_custom = pref.custom;
    pref_light_color = pref.light_color;
    pref_dark_color = pref.dark_color;
    if (pref.last_version == null) { //updates from v1.3.1 to newer versions
      browser.storage.local.set({ last_version: "v1.5.2", force: false });
    }
    if (pref_custom == null || pref_light_color == null || pref_dark_color == null) { //added from v1.3
      browser.storage.local.set({
        custom: false,
        light_color: default_light_color,
        dark_color: default_dark_color
      });
    }
    if (scheme == null || force == null) { //first time install
      if (light_mode_match()) { //Read present theme to select color scheme
        scheme = "light";
        browser.browserSettings.overrideContentColorScheme.set({ value: "light" });
      } else {
        scheme = "dark";
        browser.browserSettings.overrideContentColorScheme.set({ value: "dark" });
      }
      browser.storage.local.set({ scheme: scheme, force: false }).then(browser.runtime.openOptionsPage);
    }
    if (scheme == "system") { //added from v1.4
      if (light_mode_match()) {
        scheme = "light";
      } else {
        scheme = "dark";
      }
    }
    update();
  });
}

//Use port_ContentScript to speed things up
browser.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg, sender, sendResponse) {
    changeFrameColorTo(sender.sender.tab.windowId, msg.color, darkMode(msg.color));
  });
});

browser.tabs.onUpdated.addListener(update); //When new tab is opened / reloaded
browser.tabs.onActivated.addListener(update); //When switch tabs
browser.tabs.onAttached.addListener(update); //When attach tab to windows
browser.windows.onFocusChanged.addListener(update); //When new window is opened
chrome.runtime.onMessage.addListener(update); //When preferences changed
//window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", update_when_follow_system); //When color scheme changes

const light_mode_match_media = window.matchMedia("(prefers-color-scheme: light)");

if (light_mode_match_media != null) light_mode_match_media.onchange = update_when_follow_system;

update();

var follow_system = false; //v1.4.7 temporary fix
function update_when_follow_system() {
  if (follow_system) update();
}

/**
 * Updates pref cache and triggers color change in all windows.
 */
function update() {
  //browser.storage.local.set({force: true}); //v1.3.1 temporary fix
  chrome.tabs.query({ active: true, status: "complete" }, function (tabs) {
    browser.storage.local.get(function (pref) {
      scheme = pref.scheme;
      force = pref.force;
      pref_custom = pref.custom;
      pref_light_color = pref.light_color;
      pref_dark_color = pref.dark_color;
      browser.browserSettings.overrideContentColorScheme.set({ value: scheme });
      if (scheme == "system") {
        follow_system = true;
        if (light_mode_match()) {
          scheme = "light";
        } else {
          scheme = "dark";
        }
      } else {
        follow_system = false;
      }
      if (pref_custom) {
        default_light_color = pref_light_color;
        default_dark_color = pref_dark_color;
      } else {
        default_light_color = "#FFFFFF";
        default_dark_color = "#1C1B22";
      }
      tabs.forEach(updateEachWindow);
    });
  });
}

/**
 * Updates the color for a window.
 * 
 * @param {object} tab The tab the window is showing
 */
function updateEachWindow(tab) {
  let url = tab.url;
  let windowId = tab.windowId;
  if (url.startsWith("file:")) {
    if (scheme == "dark") {
      changeFrameColorTo(windowId, "rgb(56, 56, 61)", true);
    } else if (scheme == "light") {
      changeFrameColorTo(windowId, "rgb(249, 249, 250)", false);
    }
  } else if (url.startsWith("moz-extension:")) {
    if (scheme == "dark") {
      changeFrameColorTo(windowId, "rgb(50, 50, 50)", true);
    } else if (scheme == "light") {
      changeFrameColorTo(windowId, "rgb(236, 236, 236)", false);
    }
  } else {
    let key = getSearchKey(url);
    let reversed_scheme = "light";
    if (scheme == "light") reversed_scheme = "dark";
    if (reservedColor[scheme][key] != null) { //For prefered scheme there's a reserved color
      changeFrameColorTo(windowId, reservedColor[scheme][key], scheme == "dark");
    } else if (reservedColor[reversed_scheme][key] != null) { //Site has reserved color in the other mode
      changeFrameColorTo(windowId, reservedColor[reversed_scheme][key], reversed_scheme == "dark");
    } else if (url.startsWith("about:") || url.startsWith("addons.mozilla.org")) {
      changeFrameColorTo(windowId, "", null);
    } else {
      browser.tabs.sendMessage(tab.id, { message: "remind_me" }, function (response) {
        if (response == null) {
          console.log("No connection to content script")
        }
      });
    }
  }
}

/**
 * Changes tab bar to the appointed color (with windowId).
 * 
 * "force" and "scheme" come from preferences.
 * 
 * force: false => normal;
 * force: true, scheme: dark, darkMode: true => normal;
 * force: true, scheme: light, darkMode: false => normal;
 * force: true, scheme: dark, darkMode: false => dark;
 * force: true, scheme: light, darkMode: true => light;
 * 
 * if color is empty, then roll back to default color.
 * 
 * @param {number} windowId The ID of the window
 * @param {string} color The color to change to
 * @param {boolean} dark_mode Toggle dark mode
 */
function changeFrameColorTo(windowId, color, dark_mode) {
  if (dark_mode == null) dark_mode = scheme == "dark";
  if (color == "" || color == null) { //gonna reset
    if (dark_mode) {
      adaptive_themes['dark']['colors']['frame'] = default_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = default_dark_color;
      adaptive_themes['dark']['colors']['popup'] = default_dark_color;
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(default_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(default_dark_color, 0.05);
      adaptive_themes['dark']['colors']['ntp_background'] = default_dark_color;
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      adaptive_themes['light']['colors']['frame'] = default_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = default_light_color;
      adaptive_themes['light']['colors']['popup'] = default_light_color;
      adaptive_themes['light']['colors']['toolbar_field'] = dimColor(default_light_color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field_focus'] = dimColor(default_light_color, -0.05);
      adaptive_themes['light']['colors']['ntp_background'] = default_light_color;
      applyTheme(windowId, adaptive_themes['light']);
    }
  } else if (!force || (force && scheme == "dark" && dark_mode) || (force && scheme == "light" && !dark_mode)) { //normal coloring
    if (dark_mode) {
      if (color == "DEFAULT") color = default_dark_color;
      adaptive_themes['dark']['colors']['frame'] = color;
      adaptive_themes['dark']['colors']['frame_inactive'] = color;
      adaptive_themes['dark']['colors']['popup'] = color;
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(color, 0.05);
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      if (color == "DEFAULT") color = default_light_color;
      adaptive_themes['light']['colors']['frame'] = color;
      adaptive_themes['light']['colors']['frame_inactive'] = color;
      adaptive_themes['light']['colors']['popup'] = color;
      adaptive_themes['light']['colors']['toolbar_field'] = dimColor(color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field_focus'] = dimColor(color, -0.05);
      applyTheme(windowId, adaptive_themes['light']);
    }
  } else if (force) { //force coloring
    if (scheme == "dark") {
      adaptive_themes['dark']['colors']['frame'] = default_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = default_dark_color;
      adaptive_themes['dark']['colors']['popup'] = default_dark_color;
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(default_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(default_dark_color, 0.05);
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      adaptive_themes['light']['colors']['frame'] = default_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = default_light_color;
      adaptive_themes['light']['colors']['popup'] = default_light_color;
      adaptive_themes['light']['colors']['toolbar_field'] = dimColor(default_light_color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field_focus'] = dimColor(default_light_color, -0.05);
      applyTheme(windowId, adaptive_themes['light']);
    }
  }
}

/**
 * Applies theme to certain window.
 * 
 * @param {number} windowId The ID of the target window
 * @param {object} theme The theme to apply
 */
function applyTheme(windowId, theme) {
  browser.theme.update(windowId, theme);
}

/**
 * Gets the key word to search in reservedColor.
 * 
 * @param {string} url an URL
 * @returns e.g. "about:blank", "addons.mozilla.org"
 */
function getSearchKey(url) {
  let key = "";
  if (url.startsWith("about:")) {
    key = url.split(/\/|\?/)[0]; //e.g. key can be "about:blank"
  } else {
    key = url.split(/\/|\?/)[2]; // e.g. key can be "addons.mozilla.org"
  }
  return key;
}

/** 
 * Returns if dark mode should be used considering the color.
 * 
 * @param {string} color The color to check (hex or rgb)
 * @returns {boolean} "true" => dark mode; "false" => light mode
*/
function darkMode(color) {
  if (color == "" || color == null) {
    return null;
  } else {
    if (tooBright(color)) {
      return false;
    } else if (tooDark(color)) {
      return true;
    } else {
      return null;
    }
  }
}

/**
 * Returns if a color is too bright.
 * 
 * @param {string} color The color to check (hex or rgb)
 * @returns {boolean} true if the color is bright
 */
function tooBright(color) {
  return rgbObjBrightness(anyToRgba(color)) > 155;
}

/**
 * Returns if a color is too dark.
 * 
 * @param {string} color The color to check (hex or rgb)
 * @returns {boolean} true if the color is dark
 */
function tooDark(color) {
  return rgbObjBrightness(anyToRgba(color)) < 100;
}

/**
 * Dims or lightens color.
 * 
 * @param {string} color Color to process
 * @param {number} dim between -1.0 (dim) to 1.0 (light)
 * @returns Dimmed or lightened color
 */
function dimColor(color, dim) {
  let color_obj = anyToRgba(color);
  if (dim >= 0) {
    color_obj.r = color_obj.r + dim * (255 - color_obj.r);
    color_obj.g = color_obj.g + dim * (255 - color_obj.g);
    color_obj.b = color_obj.b + dim * (255 - color_obj.b);
  } else {
    color_obj.r = (dim + 1) * color_obj.r;
    color_obj.g = (dim + 1) * color_obj.g;
    color_obj.b = (dim + 1) * color_obj.b;
  }
  return "rgb(" + color_obj.r + ", " + color_obj.g + ", " + color_obj.b + ")";
}

/**
 * Gets brightness value from rgb object.
 * 
 * @param {object} rgb color in object
 * @returns brightness of the color
 */
function rgbObjBrightness(rgb) {
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

/**
 * @param {string} color Color in string
 * @returns Color in object
 */
function anyToRgba(color) {
  if (color.startsWith("#")) {
    return hexToRgba(color);
  } else {
    return rgbaToRgba(color);
  }
}

/**
 * Converts hex color (String) to rgb (Object).
 * @author TimDown stackoverflow.com
 * 
 * @param {string} hex color in hex
 * @returns color in object
 */
function hexToRgba(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1
  } : null;
}

/**
 * Converts rgba/rgb (String) to rgba (Object).
 * 
 * @param {string} rgbaString color in rgba/rgb
 * @returns color in object
 */
 function rgbaToRgba(rgbaString) {
	var result = rgbaString.match(/[.?\d]+/g).map(Number);
	if (result.length == 3) result[3] = 1;
	return result ? {
		r: result[0],
		g: result[1],
		b: result[2],
		a: result[3]
	} : null;
}

/**
 * @returns true if in light mode, false if in dark mode or cannot detect
 */
function light_mode_match() {
  if (light_mode_match_media != null && light_mode_match_media.matches) {
    return true;
  } else {
    return false;
  }
}