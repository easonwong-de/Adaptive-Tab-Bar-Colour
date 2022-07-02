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
  }
};

//Settings cache
//Always synced with settings page
var pref_scheme;
var pref_force;
var pref_dynamic;
var pref_custom;
var pref_light_color;
var pref_dark_color;
var pref_last_version;
var pref_reservedColor_cs;

//Default values
const default_light_color = "#FFFFFF";
const default_dark_color = "#1C1B22";
/* reserved color is a color => the color is the theme color for the web
reserved color is IGNORE_THEME => use calculated color as theme color
reserved color is a tag name => theme color is stored under that tag
reserved color is a class name => theme color is stored under that class */
const default_reservedColor_cs = {
  "developer.mozilla.org": "IGNORE_THEME",
  "github.com": "IGNORE_THEME",
  "mail.google.com": "CLASS_wl",
  "open.spotify.com": "#000000",
  "www.instagram.com": "IGNORE_THEME",
  "www.youtube.com": "IGNORE_THEME"
};

//These prefs are controlled by other prefs
var current_scheme;
var current_light_color;
var current_dark_color;
var current_reservedColor_cs;

/* Pages where content script can't be injected
other reserved color are in content_script.js
url listed only in "light"/"dark" => only use that color regardless of the color scheme
url listed in both => choose color scheme as needed
url listed as "DEFAULT" => use default_light/dark_color */
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

var aboveV95 = true;
updateAboveV95();

/**
 * Loads preferences into cache.
 * Also modifies the "current" data.
 */
function loadPref(pref) {
  //loads prefs
  pref_scheme = pref.scheme;
  pref_force = pref.force;
  pref_dynamic = pref.dynamic;
  pref_custom = pref.custom;
  pref_light_color = pref.light_color;
  pref_dark_color = pref.dark_color;
  pref_last_version = pref.last_version;
  pref_reservedColor_cs = pref.reservedColor_cs;
  //loads currents
  if (pref_custom) {
    current_light_color = pref_light_color;
    current_dark_color = pref_dark_color;
    current_reservedColor_cs = pref_reservedColor_cs;
  } else {
    current_light_color = default_light_color;
    current_dark_color = default_dark_color;
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
    let pending_dynamic = pref.dynamic;
    let pending_custom = pref_custom;
    let pending_light_color = pref_light_color;
    let pending_dark_color = pref_dark_color;
    let pending_last_version = [1, 6, 2];
    let pending_reservedColor_cs = pref_reservedColor_cs;
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
      custom: pending_custom,
      light_color: pending_light_color,
      dark_color: pending_dark_color,
      last_version: pending_last_version,
      reservedColor_cs: pending_reservedColor_cs
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
  browser.tabs.query({ active: true, status: "complete" }, tabs => {
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
  if (url.startsWith("file:")) {
    if (current_scheme == "dark") {
      changeFrameColorTo(windowId, "rgb(56, 56, 61)", true);
    } else if (current_scheme == "light") {
      changeFrameColorTo(windowId, "rgb(249, 249, 250)", false);
    }
  } else if (url.startsWith("moz-extension:")) {
    if (current_scheme == "dark") {
      changeFrameColorTo(windowId, "rgb(50, 50, 50)", true);
    } else if (current_scheme == "light") {
      changeFrameColorTo(windowId, "rgb(236, 236, 236)", false);
    }
  } else {
    let key = getSearchKey(url);
    let reversed_scheme = "light";
    if (current_scheme == "light") reversed_scheme = "dark";
    if (reservedColor[current_scheme][key] != null) { //For prefered scheme there's a reserved color
      changeFrameColorTo(windowId, reservedColor[current_scheme][key], current_scheme == "dark");
    } else if (reservedColor[reversed_scheme][key] != null) { //Site has reserved color in the other mode
      changeFrameColorTo(windowId, reservedColor[reversed_scheme][key], reversed_scheme == "dark");
    } else if (url.startsWith("about:") || url.startsWith("addons.mozilla.org")) {
      changeFrameColorTo(windowId, "", null);
    } else {
      browser.tabs.sendMessage(tab.id, {
        reason: "COLOR_REQUEST",
        dynamic: pref_dynamic,
        reservedColor_cs: current_reservedColor_cs
      }, response => {
        if (response == null) console.error("No connection to content script.");
      });
    }
  }
}

//Recieves the color from content script
browser.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((message, sender, sendResponse) => {
    let color_obj = ANY_to_RGBA(message.color);
    //unfinished
    changeFrameColorTo(sender.sender.tab.windowId, message.color, isDarkModeSuitable(message.color));
  });
});

/**
 * Converts color in object "r, g, b" to text "rgb(xxx)".
 * @param {*} color Color in object.
 * @returns Color in text.
 */
function colorObjToText(color) {
  return "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
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
  if (dark_mode == null) dark_mode = current_scheme == "dark";
  if (color == "" || color == null) { //gonna reset
    if (dark_mode) {
      adaptive_themes['dark']['colors']['frame'] = current_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = current_dark_color;
      adaptive_themes['dark']['colors']['popup'] = dimColor(current_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(current_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(current_dark_color, 0.05);
      adaptive_themes['dark']['colors']['ntp_background'] = current_dark_color;
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      adaptive_themes['light']['colors']['frame'] = current_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = current_light_color;
      adaptive_themes['light']['colors']['popup'] = dimColor(current_light_color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field'] = dimColor(current_light_color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field_focus'] = dimColor(current_light_color, -0.05);
      adaptive_themes['light']['colors']['ntp_background'] = current_light_color;
      applyTheme(windowId, adaptive_themes['light']);
    }
  } else if (!pref_force || (pref_force && current_scheme == "dark" && dark_mode) || (pref_force && current_scheme == "light" && !dark_mode)) { //normal coloring
    if (dark_mode) {
      if (color == "DEFAULT") color = current_dark_color;
      adaptive_themes['dark']['colors']['frame'] = color;
      adaptive_themes['dark']['colors']['frame_inactive'] = color;
      adaptive_themes['dark']['colors']['popup'] = dimColor(color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(color, 0.05);
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      if (color == "DEFAULT") color = current_light_color;
      adaptive_themes['light']['colors']['frame'] = color;
      adaptive_themes['light']['colors']['frame_inactive'] = color;
      adaptive_themes['light']['colors']['popup'] = dimColor(color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field'] = dimColor(color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field_focus'] = dimColor(color, -0.05);
      applyTheme(windowId, adaptive_themes['light']);
    }
  } else if (pref_force) { //force coloring
    if (current_scheme == "dark") {
      adaptive_themes['dark']['colors']['frame'] = current_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = current_dark_color;
      adaptive_themes['dark']['colors']['popup'] = dimColor(current_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(current_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(current_dark_color, 0.05);
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      adaptive_themes['light']['colors']['frame'] = current_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = current_light_color;
      adaptive_themes['light']['colors']['popup'] = dimColor(current_light_color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field'] = dimColor(current_light_color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field_focus'] = dimColor(current_light_color, -0.05);
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
 * @param {string} color The color to check
 * @returns {boolean} "true" => dark mode; "false" => light mode
*/
function isDarkModeSuitable(color) {
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
  return rgbBrightness(ANY_to_RGBA(color)) > 155;
}

/**
 * Returns if a color is too dark.
 * 
 * @param {string} color The color to check (hex or rgb)
 * @returns {boolean} true if the color is dark
 */
function tooDark(color) {
  return rgbBrightness(ANY_to_RGBA(color)) < 100;
}

/**
 * Dims or lightens color.
 * 
 * @param {string} color Color to process
 * @param {number} dim between -1.0 (dim) to 1.0 (light)
 * @returns Dimmed or lightened color
 */
function dimColor(color, dim) {
  let color_obj = ANY_to_RGBA(color);
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
 * @param {object} color Color in object
 * @returns Brightness of the color
 */
function rgbBrightness(color) {
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
}

/**
 * @param {string} color Color in string
 * @returns Color in object
 */
function ANY_to_RGBA(color) {
  if (color.startsWith("#")) {
    return HEXA_to_RGBA(color);
  } else if (color.startsWith("rgb")) {
    return RGBA_to_RGBA(color);
  } else if (color.startsWith("hsl")) {
    return HSLA_to_RGBA(color);
  } else {
    return NAME_to_RGBA(color);
  }
}

/**
 * Converts rgba/rgb (String) to rgba (Object).
 * 
 * @param {string} rgba color in rgba/rgb
 * @returns color in object
 */
function RGBA_to_RGBA(rgba) {
  let result = [0, 0, 0, 0];
  result = rgba.match(/[.?\d]+/g).map(Number);
  if (result.length == 3) result[3] = 1;
  return {
    r: result[0],
    g: result[1],
    b: result[2],
    a: result[3]
  };
}

/**
 * Converts hex(a) (String) to rgba (Object).
 * @author Jon Kantner (modified by Eason Wong)
 * 
 * @param {string} hexa Color in hex(a)
 * @returns Color in object
 */
function HEXA_to_RGBA(hexa) {
  let r = g = b = a = "00";
  switch (hexa.length) {
    case 4:
      r = hexa[1] + hexa[1];
      g = hexa[2] + hexa[2];
      b = hexa[3] + hexa[3];
      break;
    case 5:
      r = hexa[1] + hexa[1];
      g = hexa[2] + hexa[2];
      b = hexa[3] + hexa[3];
      a = hexa[4] + hexa[4];
      break;
    case 7:
      r = hexa[1] + hexa[2];
      g = hexa[3] + hexa[4];
      b = hexa[5] + hexa[6];
      break;
    case 9:
      r = hexa[1] + hexa[2];
      g = hexa[3] + hexa[4];
      b = hexa[5] + hexa[6];
      a = hexa[7] + hexa[8];
      break;
    default:
      break;
  }
  return {
    r: parseInt(r, 16),
    g: parseInt(g, 16),
    b: parseInt(b, 16),
    a: parseInt(a, 16)
  };
}

/**
 * Converts hsl(a) (String) to rgba (Object).
 * @author Jon Kantner (modified by Eason Wong)
 * 
 * @param {string} hsla Color in hsl(a)
 * @returns Color in object
 */
function HSLA_to_RGBA(hsla) {
  let sep = hsla.indexOf(",") > -1 ? "," : " ";
  let hsla_param = hsla.split("(")[1].split(")")[0].split(sep);
  // strip the slash if using space-separated syntax
  if (hsla_param.indexOf("/") > -1)
    hsla_param.splice(3, 1);
  // must be fractions of 1
  let h = hsla_param[0],
    s = hsla_param[1].substring(0, hsla_param[1].length - 1) / 100,
    l = hsla_param[2].substring(0, hsla_param[2].length - 1) / 100,
    a = hsla_param[3] ? hsla_param[3] : 1;
  // strip label and convert to degrees (if necessary)
  if (h.indexOf("deg") > -1)
    h = h.substring(0, h.length - 3);
  else if (h.indexOf("rad") > -1)
    h = Math.round(h.substring(0, h.length - 3) / (2 * Math.PI) * 360);
  else if (h.indexOf("turn") > -1)
    h = Math.round(h.substring(0, h.length - 4) * 360);
  if (h >= 360)
    h %= 360;
  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs((h / 60) % 2 - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  if (typeof a == "string" && a.indexOf("%") > -1)
    a = a.substring(0, a.length - 1) / 100;
  return {
    r: r,
    g: g,
    b: b,
    a: a / 1
  };
}

/**
 * Converts color name (String) to rgba (Object).
 * If the name is not a legit color name, returns TRANSPARENT.
 * @author Jon Kantner (modified by Eason Wong)
 * 
 * @param {string} name Color in name
 * @returns Color in object
 */
function NAME_to_RGBA(name) {
  // Create fake div
  let fakeDiv = document.createElement("div");
  fakeDiv.style.backgroundColor = name;
  fakeDiv.style.display = "none";
  document.body.appendChild(fakeDiv);
  // Get color of div
  let cs = window.getComputedStyle(fakeDiv),
    pv = cs.backgroundColor
  // Remove div after obtaining desired color value
  document.body.removeChild(fakeDiv);

  return pv;
}

/**
 * Checks if Firefox is v95.0 or later.
 */
function updateAboveV95() {
  let str = navigator.userAgent;
  let ind = str.lastIndexOf("Firefox");
  if (ind != -1) {
    str = str.substring(ind + 8);
    aboveV95 = Number(str) >= 95;
  } else {
    aboveV95 = true; //default answer
  }
}