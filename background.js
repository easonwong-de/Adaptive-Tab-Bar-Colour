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
      //Texts and icons
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
  },
  "darknoise": {
    colors: {
      //Theme colors
      frame: "rgb(33, 33, 33)",
      frame_inactive: "rgb(33, 33, 33)",
      popup: "rgb(44, 44, 44)",
      ntp_background: "rgb(33, 33, 33)",
      toolbar_field: "rgb(44, 44, 44)",
      toolbar_field_focus: "rgb(44, 44, 44)",
      //Texts and icons
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
    },
    images: {
      additional_backgrounds: ["images/imagedoc-darknoise.png"]
    },
    properties: {
      additional_backgrounds_alignment: ["left bottom"],
      additional_backgrounds_tiling: ["repeat"]
    }
  }
};

//Settings cache
//Always synced with settings page
var pref_scheme;
var pref_force;
var pref_dynamic;
var pref_tabbar_color;
var pref_toolbar_color;
var pref_popup_color;
var pref_custom;
var pref_light_color;
var pref_dark_color;
var pref_reservedColor_cs;
var pref_last_version;

//Default values
const default_light_color = "#FFFFFF";
const default_dark_color = "#1C1B22";

/* reserved color is a color => the color is the theme color for the web
reserved color is IGNORE_THEME => use calculated color as theme color
reserved color is a tag name => theme color is stored under that tag
reserved color is a class name => theme color is stored under that class */
const default_reservedColor_cs = Object.freeze({
  "developer.mozilla.org": "IGNORE_THEME",
  "github.com": "IGNORE_THEME",
  "mail.google.com": "CLASS_wl",
  "open.spotify.com": "#000000",
  "www.bbc.com": "IGNORE_THEME",
  "www.instagram.com": "IGNORE_THEME",
  "www.spiegel.de": "IGNORE_THEME",
  "www.youtube.com": "IGNORE_THEME"
});

//These prefs are controlled by other prefs
var current_scheme;
var current_light_color;
var current_dark_color;
var current_reservedColor_cs;

/* Pages where content script can't be injected
other reserved color are in content_script.js
url listed only in "light"/"dark" => only use that color regardless of the color scheme
url listed in both => choose color scheme as needed
url listed as "DEFAULT" => use default_light/dark_color
url listed as "DARKNOISE" => use "darknoise" theme */
const reservedColor = {
  "light": {
    "about:checkerboard": "DEFAULT",
    "about:debugging#": "rgb(249, 249, 250)",
    "about:devtools-toolbox": "rgb(249, 249, 250)",
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
    "support.mozilla.org": "rgb(255, 255, 255)"
  },
  "dark": {
    "about:debugging#": "DEFAULT",
    "about:devtools-toolbox": "rgb(12, 12, 13)",
    "about:logo": "DARKNOISE",
    "about:mozilla": "rgb(143, 15, 7)",
    "about:performance": "rgb(35, 34, 42)",
    "about:plugins": "rgb(43, 42, 50)",
    "about:privatebrowsing": "rgb(37, 0, 62)",
    "about:processes": "rgb(43, 42, 50)",
    "about:sync-log": "rgb(30, 30, 30)",
    "accounts-static.cdn.mozilla.net": "DEFAULT",
    "addons.mozilla.org": "rgb(32, 18, 58)",
    "addons.cdn.mozilla.net": "DEFAULT",
    "content.cdn.mozilla.net": "DEFAULT",
    "install.mozilla.org": "DEFAULT"
  }
}

var aboveV95 = true;
updateVersionStatus95();

/**
 * Loads preferences into cache.
 * Also modifies the "current" data.
 */
function loadPref(pref) {
  //loads prefs
  pref_scheme = pref.scheme;
  pref_force = pref.force;
  pref_dynamic = pref.dynamic;
  pref_tabbar_color = pref.tabbar_color;
  pref_toolbar_color = pref.toolbar_color;
  pref_popup_color = pref.popup_color;
  pref_custom = pref.custom;
  pref_light_color = pref.light_color;
  pref_dark_color = pref.dark_color;
  pref_reservedColor_cs = pref.reservedColor_cs;
  pref_last_version = pref.last_version;
  //loads currents
  if (pref_custom) {
    current_light_color = rgba(pref_light_color);
    current_dark_color = rgba(pref_dark_color);
    current_reservedColor_cs = pref_reservedColor_cs;
  } else {
    current_light_color = rgba(default_light_color);
    current_dark_color = rgba(default_dark_color);
    current_reservedColor_cs = default_reservedColor_cs;
  }
  switch (pref_scheme) {
    case "light":
      current_scheme = "light";
      break;
    case "dark":
      current_scheme = "dark";
      break;
    case "system":
      current_scheme = lightModeDetected() ? "light" : "dark";
      break;
    default:
      break;
  }
}

//Fired when the extension is first installed
//when the extension is updated to a new version
//and when the browser is updated to a new version
browser.runtime.onInstalled.addListener(init);

/**
 * Initializes the settings, then opens options page.
 */
function init() {
  browser.storage.local.get(pref => {
    loadPref(pref);
    let pending_scheme = pref_scheme;
    let pending_force = pref_force;
    let pending_dynamic = pref_dynamic;
    let pending_tabbar_color = pref_tabbar_color;
    let pending_toolbar_color = pref_toolbar_color;
    let pending_popup_color = pref_popup_color;
    let pending_custom = pref_custom;
    let pending_light_color = pref_light_color;
    let pending_dark_color = pref_dark_color;
    let pending_reservedColor_cs = pref_reservedColor_cs;
    let pending_last_version = [1, 6, 4];
    //updates from v1.6.3 or earlier
    if (pref_toolbar_color == null) {
      pending_toolbar_color = 0;
    }
    //updates from v1.6.2 or earlier
    if (pref_tabbar_color == null || pref_popup_color == null) {
      pending_tabbar_color = 0;
      pending_popup_color = 0.05;
    }
    //updates from v1.5.7 or earlier
    if (pref_reservedColor_cs == null) {
      pending_reservedColor_cs = default_reservedColor_cs;
    }
    //updates from v1.5.3 or earlier
    if (pref_dynamic == null) {
      pending_dynamic = false;
    }
    //updates from v1.3.1 or earlier
    if (pref_last_version == null) {
      pending_force = false;
    }
    //updates from v1.3 or earlier
    if (pref_custom == null || pref_light_color == null || pref_dark_color == null) {
      pending_custom = false;
      pending_light_color = default_light_color;
      pending_dark_color = default_dark_color;
    }
    //first time install
    let firstTime = false;
    if (pref_scheme == null || pref_force == null) {
      firstTime = true;
      pending_scheme = lightModeDetected() ? "light" : "dark";
      pending_force = false;
      if (aboveV95)
        browser.browserSettings.overrideContentColorScheme.set({ value: pending_scheme });
    }
    if (!aboveV95) {
      pending_force = true;
    }
    browser.storage.local.set({
      scheme: pending_scheme,
      force: pending_force,
      dynamic: pending_dynamic,
      tabbar_color: pending_tabbar_color,
      toolbar_color: pending_toolbar_color,
      popup_color: pending_popup_color,
      custom: pending_custom,
      light_color: pending_light_color,
      dark_color: pending_dark_color,
      reservedColor_cs: pending_reservedColor_cs,
      last_version: pending_last_version
    });
    if (firstTime) browser.runtime.openOptionsPage();
    update();
  });
}

browser.tabs.onUpdated.addListener(update); //When new tab is opened / reloaded
browser.tabs.onActivated.addListener(update); //When switch tabs
browser.tabs.onAttached.addListener(update); //When attach tab to windows
browser.windows.onFocusChanged.addListener(update); //When new window is opened
browser.runtime.onMessage.addListener(update); //When preferences changed

const light_mode_match_media = window.matchMedia("(prefers-color-scheme: light)");
if (light_mode_match_media != null) light_mode_match_media.onchange = update_when_follow_system;

/**
 * @returns true if in light mode, false if in dark mode or cannot detect
 */
function lightModeDetected() {
  return light_mode_match_media != null && light_mode_match_media.matches;
}

function update_when_follow_system() {
  if (pref_scheme == "system") update();
}

update();

/**
 * Updates pref cache and triggers color change in all windows.
 */
function update() {
  browser.tabs.query({ active: true }, tabs => {
    browser.storage.local.get(pref => {
      loadPref(pref);
      if (aboveV95)
        browser.browserSettings.overrideContentColorScheme.set({ value: pref_scheme });
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
  if (url.startsWith("moz-extension:")) {
    //When visiting add-on settings page (content script blocked)
    if (current_scheme == "dark") {
      changeFrameColorTo(windowId, rgba([50, 50, 50, 1]), true);
    } else if (current_scheme == "light") {
      changeFrameColorTo(windowId, rgba([236, 236, 236, 1]), false);
    }
  } else if (url.startsWith("chrome:") || url.startsWith("resource:") || url.startsWith("jar:file:")) {
    //When visiting internal files (content script blocked)
    if (current_scheme == "dark") {
      if (url.endsWith(".txt") || url.endsWith(".css") || url.endsWith(".jsm")) {
        changeFrameColorTo(windowId, rgba([50, 50, 50, 1]), true);
      } else if (url.endsWith(".png") || url.endsWith(".css")) {
        changeFrameColorTo(windowId, "DARKNOISE");
      } else {
        changeFrameColorTo(windowId, rgba([30, 30, 30, 1]), true);
      }
    } else if (current_scheme == "light") {
      if (url.endsWith(".txt") || url.endsWith(".css") || url.endsWith(".jsm")) {
        changeFrameColorTo(windowId, rgba([236, 236, 236, 1]), false);
      } else if (url.endsWith(".png") || url.endsWith(".css")) {
        changeFrameColorTo(windowId, "DARKNOISE");
      } else {
        changeFrameColorTo(windowId, rgba([255, 255, 255, 1]), false);
      }
    }
  } else {
    //When visiting normal websites, pdf viewer (content script blocked), or local files
    let key = getSearchKey(url);
    let reversed_scheme = "light";
    if (current_scheme == "light") reversed_scheme = "dark";
    if (reservedColor[current_scheme][key] != null) { //For prefered scheme there's a reserved color
      changeFrameColorTo(windowId, rgba(reservedColor[current_scheme][key]), current_scheme == "dark");
    } else if (reservedColor[reversed_scheme][key] != null) { //Site has reserved color in the other mode
      changeFrameColorTo(windowId, rgba(reservedColor[reversed_scheme][key]), reversed_scheme == "dark");
    } else if (url.startsWith("about:")) {
      changeFrameColorTo(windowId, "DEFAULT");
    } else {
      browser.tabs.sendMessage(tab.id, {
        reason: "COLOR_REQUEST",
        dynamic: pref_dynamic,
        reservedColor_cs: current_reservedColor_cs
      }, response => {
        if (response == null) {
          if (url.endsWith(".pdf")) { //When viewing a pdf file, Firefox blocks content script
            console.log(url + "\nMight be pdf viewer.");
            if (current_scheme == "dark") {
              changeFrameColorTo(windowId, rgba([56, 56, 61, 1]), true);
            } else if (current_scheme == "light") {
              changeFrameColorTo(windowId, rgba([249, 249, 250, 1]), false);
            }
          } else {
            console.error(url + "\nNo connection to content script.");
          }
        }
      });
    }
  }
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

//Recieves the color from content script
browser.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((message, sender, sendResponse) => {
    changeFrameColorTo(sender.sender.tab.windowId, message.color, isDarkModeSuitable(message.color));
  });
});

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
 * @param {number} windowId The ID of the window.
 * @param {object | string} color The color to change to in rgb object or command string.
 * @param {boolean} dark_mode Decides text color. Leaves "null" to let add-on prefs decide.
 */
function changeFrameColorTo(windowId, color, dark_mode) {
  //dark_mode is null means the color is not bright nor dark
  //Then choose text color following the setting
  if (dark_mode == null) dark_mode = current_scheme == "dark";
  if (color == "DARKNOISE") { //Image viewer
    changeThemePara(rgba([33, 33, 33, 1]), "darknoise", false);
    applyTheme(windowId, adaptive_themes["darknoise"]);
  } else if (color == "PLAINTEXT") { //Plain text viewer
    if (dark_mode) {
      changeThemePara(rgba([50, 50, 50, 1]), "dark", false);
      applyTheme(windowId, adaptive_themes["dark"]);
    } else {
      changeThemePara(rgba([236, 236, 236, 1]), "light", false);
      applyTheme(windowId, adaptive_themes["light"]);
    }
  } else if (color == null || color == "DEFAULT") { //Gonna reset
    if (dark_mode) {
      changeThemePara(current_dark_color, "dark", true);
      applyTheme(windowId, adaptive_themes["dark"]);
    } else {
      changeThemePara(current_light_color, "light", true);
      applyTheme(windowId, adaptive_themes["light"]);
    }
  } else if (!pref_force || (pref_force && current_scheme == "dark" && dark_mode) || (pref_force && current_scheme == "light" && !dark_mode)) { //Normal coloring
    if (dark_mode) {
      changeThemePara(color, "dark", false);
      applyTheme(windowId, adaptive_themes["dark"]);
    } else {
      changeThemePara(color, "light", false);
      applyTheme(windowId, adaptive_themes["light"]);
    }
  } else if (pref_force) { //Force Coloring
    if (current_scheme == "dark") {
      changeThemePara(current_dark_color, "dark", false);
      applyTheme(windowId, adaptive_themes["dark"]);
    } else {
      changeThemePara(current_light_color, "light", false);
      applyTheme(windowId, adaptive_themes["light"]);
    }
  }
}

/**
 * Adjusts the parameters in adaptive_themes.
 * 
 * @param {object} color Desired color to apply.
 * @param {string} color_scheme Color scheme, "dark" or "light".
 * @param {boolean} change_ntp_bg Determines if to change color of New Tab Page.
 */
function changeThemePara(color, color_scheme, change_ntp_bg) {
  let frame_color, toolbar_color, popup_color, ntp_color;
  if (color_scheme == "dark") {
    frame_color = dimColor(color, pref_tabbar_color);
    toolbar_color = pref_toolbar_color == pref_tabbar_color ? "rgba(0, 0, 0, 0)" : dimColor(color, pref_toolbar_color);
    popup_color = dimColor(color, pref_popup_color);
    ntp_color = dimColor(color, 0);
  } else if (color_scheme == "light") {
    frame_color = dimColor(color, -pref_tabbar_color);
    popup_color = dimColor(color, -pref_popup_color);
    toolbar_color = pref_toolbar_color == pref_tabbar_color ? "rgba(0, 0, 0, 0)" : dimColor(color, -pref_toolbar_color);
    ntp_color = dimColor(color, 0);
  } else if (color_scheme == "darknoise") {
    popup_color = dimColor(color, pref_popup_color);
    toolbar_color = "rgba(0, 0, 0, 0)";
  }
  adaptive_themes[color_scheme]["colors"]["frame"] = frame_color;
  adaptive_themes[color_scheme]["colors"]["frame_inactive"] = frame_color;
  adaptive_themes[color_scheme]["colors"]["popup"] = popup_color;
  adaptive_themes[color_scheme]["colors"]["toolbar"] = toolbar_color;
  adaptive_themes[color_scheme]["colors"]["toolbar_bottom_separator"] = toolbar_color;
  adaptive_themes[color_scheme]["colors"]["toolbar_field"] = popup_color;
  adaptive_themes[color_scheme]["colors"]["toolbar_field_focus"] = popup_color;
  if (change_ntp_bg) adaptive_themes[color_scheme]["colors"]["ntp_background"] = ntp_color;
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
 * Returns if dark mode should be used considering the color.
 * 
 * @param {object} color The color to check, in rgb object.
 * @returns {boolean} "true" => dark mode; "false" => light mode; "null" => both.
*/
function isDarkModeSuitable(color) {
  if (color == null || typeof color != "object") return null;
  let brightness = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
  if (brightness > 155) {
    return false;
  } else if (brightness < 100) {
    return true;
  } else {
    return null;
  }
}

/**
 * Dims or lightens color.
 * 
 * @param {object} color Color to process, in rgb object.
 * @param {number} dim between -1.0 (dim) to 1.0 (light).
 * @returns Dimmed or lightened color string.
 */
function dimColor(color, dim) {
  let result = Object.assign({}, color);
  if (dim > 0) {
    result.r = color.r + dim * (255 - color.r);
    result.g = color.g + dim * (255 - color.g);
    result.b = color.b + dim * (255 - color.b);
  } else if (dim < 0) {
    result.r = (dim + 1) * color.r;
    result.g = (dim + 1) * color.g;
    result.b = (dim + 1) * color.b;
  }
  return generateColorString(result);
}

/**
 * 
 * @param {object} color Color in rgb object.
 * @returns "rgb(xxx)" string, floor rounded.
 */
function generateColorString(color) {
  return "rgb(" + Math.floor(color.r) + ", " + Math.floor(color.g) + ", " + Math.floor(color.b) + ")";
}

/**
 * Converts any color to rgba object.
 * @author JayB (modified by Eason Wong)
 * 
 * @param {string | Number[]} color Color to convert.
 * @returns Color in rgba object. Pure black if invalid.
 */
function rgba(color) {
  if (typeof color == "string") {
    if (color == "DEFAULT" || color == "DARKNOISE" || color == "PLAINTEXT") return color;
    var canvas = document.createElement("canvas").getContext("2d");
    canvas.fillStyle = color;
    let color_temp = canvas.fillStyle;
    if (color_temp.startsWith("#")) {
      let r = color_temp[1] + color_temp[2];
      let g = color_temp[3] + color_temp[4];
      let b = color_temp[5] + color_temp[6];
      return {
        r: parseInt(r, 16),
        g: parseInt(g, 16),
        b: parseInt(b, 16),
        a: 1
      };
    } else {
      let result = color_temp.match(/[.?\d]+/g).map(Number);
      return {
        r: result[0],
        g: result[1],
        b: result[2],
        a: result[3]
      };
    }
  } else {
    return { r: color[0], g: color[1], b: color[2], a: color[3] };
  }
}

/**
 * Checks if Firefox is v95.0 or later.
 */
function updateVersionStatus95() {
  let str = navigator.userAgent;
  let ind = str.lastIndexOf("Firefox");
  if (ind != -1) {
    str = str.substring(ind + 8);
    aboveV95 = Number(str) >= 95;
  } else {
    aboveV95 = true; //default answer
  }
}