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
var pref_scheme;
var pref_force;
var pref_custom;
var pref_light_color;
var pref_dark_color;
var pref_last_version;

var current_scheme;

/**
 * Loads preferences into cache.
 */
function loadPref(pref) {
  pref_scheme = pref.scheme;
  pref_force = pref.force;
  pref_custom = pref.custom;
  pref_light_color = pref.light_color;
  pref_dark_color = pref.dark_color;
  pref_last_version = pref.last_version;
  if (pref_custom) {
    default_light_color = pref_light_color;
    default_dark_color = pref_dark_color;
  } else {
    default_light_color = "#FFFFFF";
    default_dark_color = "#1C1B22";
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
    let pending_custom = pref_custom;
    let pending_light_color = pref_light_color;
    let pending_dark_color = pref_dark_color;
    let pending_last_version = "v1.5.4";
    if (pref_last_version == null) { //updates from v1.3.1 to newer versions
      pending_force = false;
    }
    if (pref_custom == null || pref_light_color == null || pref_dark_color == null) { //added from v1.3
      pending_custom = false;
      pending_light_color = default_light_color;
      pending_dark_color = default_dark_color;
    }
    if (pref_scheme == null || pref_force == null) { //first time install
      pending_scheme = lightModeDetected() ? "light" : "dark";
      pending_force = false;
      browser.browserSettings.overrideContentColorScheme.set({ value: pending_scheme });
    }
    browser.storage.local.set({
      scheme: pending_scheme,
      force: pending_force,
      custom: pending_custom,
      light_color: pending_light_color,
      dark_color: pending_dark_color,
      last_version: pending_last_version
    });
    browser.runtime.openOptionsPage();
    update();
  });
}

browser.tabs.onUpdated.addListener(update); //When new tab is opened / reloaded
browser.tabs.onActivated.addListener(update); //When switch tabs
browser.tabs.onAttached.addListener(update); //When attach tab to windows
browser.windows.onFocusChanged.addListener(update); //When new window is opened
browser.runtime.onMessage.addListener(update); //When preferences changed

//When system color scheme is changed
const light_mode_match_media = window.matchMedia("(prefers-color-scheme: light)");
if (light_mode_match_media != null) light_mode_match_media.onchange = update_when_follow_system;

function update_when_follow_system() {
  if (pref_scheme == "system") update();
}

update();

/**
 * Updates pref cache and triggers color change in all windows.
 */
function update() {
  chrome.tabs.query({ active: true, status: "complete" }, tabs => {
    browser.storage.local.get(pref => {
      loadPref(pref);
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
      browser.tabs.sendMessage(tab.id, { message: "remind_me" }, function (response) {
        if (response == null) {
          console.error("No connection to content script");
        }
      });
    }
  }
}

browser.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((msg, sender, sendResponse) => {
    changeFrameColorTo(sender.sender.tab.windowId, msg.color, isDarkMode(msg.color));
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
 * @param {number} windowId The ID of the window
 * @param {string} color The color to change to
 * @param {boolean} dark_mode Toggle dark mode
 */
function changeFrameColorTo(windowId, color, dark_mode) {
  if (dark_mode == null) dark_mode = current_scheme == "dark";
  if (color == "" || color == null) { //gonna reset
    if (dark_mode) {
      adaptive_themes['dark']['colors']['frame'] = default_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = default_dark_color;
      adaptive_themes['dark']['colors']['popup'] = dimColor(default_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(default_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(default_dark_color, 0.05);
      adaptive_themes['dark']['colors']['ntp_background'] = default_dark_color;
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      adaptive_themes['light']['colors']['frame'] = default_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = default_light_color;
      adaptive_themes['light']['colors']['popup'] = dimColor(default_light_color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field'] = dimColor(default_light_color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field_focus'] = dimColor(default_light_color, -0.05);
      adaptive_themes['light']['colors']['ntp_background'] = default_light_color;
      applyTheme(windowId, adaptive_themes['light']);
    }
  } else if (!pref_force || (pref_force && current_scheme == "dark" && dark_mode) || (pref_force && current_scheme == "light" && !dark_mode)) { //normal coloring
    if (dark_mode) {
      if (color == "DEFAULT") color = default_dark_color;
      adaptive_themes['dark']['colors']['frame'] = color;
      adaptive_themes['dark']['colors']['frame_inactive'] = color;
      adaptive_themes['dark']['colors']['popup'] = dimColor(color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(color, 0.05);
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      if (color == "DEFAULT") color = default_light_color;
      adaptive_themes['light']['colors']['frame'] = color;
      adaptive_themes['light']['colors']['frame_inactive'] = color;
      adaptive_themes['light']['colors']['popup'] = dimColor(color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field'] = dimColor(color, -0.05);
      adaptive_themes['light']['colors']['toolbar_field_focus'] = dimColor(color, -0.05);
      applyTheme(windowId, adaptive_themes['light']);
    }
  } else if (pref_force) { //force coloring
    if (current_scheme == "dark") {
      adaptive_themes['dark']['colors']['frame'] = default_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = default_dark_color;
      adaptive_themes['dark']['colors']['popup'] = dimColor(default_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field'] = dimColor(default_dark_color, 0.05);
      adaptive_themes['dark']['colors']['toolbar_field_focus'] = dimColor(default_dark_color, 0.05);
      applyTheme(windowId, adaptive_themes['dark']);
    } else {
      adaptive_themes['light']['colors']['frame'] = default_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = default_light_color;
      adaptive_themes['light']['colors']['popup'] = dimColor(default_light_color, -0.05);
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
 * @returns true if in light mode, false if in dark mode or cannot detect
 */
function lightModeDetected() {
  return (light_mode_match_media != null && light_mode_match_media.matches) ? true : false;
}