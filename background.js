var adaptive_themes = {
  "light": {
    colors: {
      toolbar: "rgba(0, 0, 0, 0)",
      toolbar_text: "rgb(0, 0, 0)",
      frame: "rgb(255, 255, 255)",
      tab_background_text: "rgb(30, 30, 30)",
      toolbar_field: "rgb(235, 235, 235)",
      toolbar_field_text: "rgb(0, 0, 0)",
      tab_line: "rgba(0, 0, 0, 0)",
      popup: "rgb(255, 255, 255)",
      popup_text: "rgb(0, 0, 0)",
      button_background_active: "rgba(0, 0, 0, 0.15)",
      button_background_hover: "rgba(0, 0, 0, 0.10)",
      frame_inactive: "rgb(255, 255, 255)",
      icons: "rgb(30, 30, 30)",
      ntp_background: "rgb(255, 255, 255)",
      ntp_text: "rgb(0, 0, 0)",
      popup_border: "rgba(0, 0, 0, 0)",
      sidebar_border: "rgba(0, 0, 0, 0)",
      tab_selected: "rgba(0, 0, 0, 0.15)",
      toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
      toolbar_field_border_focus: "rgb(130, 180, 245)",
      toolbar_top_separator: "rgba(0, 0, 0, 0)",
      tab_loading: "rgba(0, 0, 0, 0)",
    }
  },
  "dark": {
    colors: {
      toolbar: "rgba(0, 0, 0, 0)",
      toolbar_text: "rgb(255, 255, 255)",
      frame: "rgb(28, 27, 34)",
      tab_background_text: "rgb(226, 226, 226)",
      toolbar_field: "rgb(30, 30, 30)",
      toolbar_field_text: "rgb(255, 255, 255)",
      tab_line: "rgba(0, 0, 0, 0)",
      popup: "rgb(28, 27, 34)",
      popup_text: "rgb(225, 225, 225)",
      button_background_active: "rgba(255, 255, 255, 0.15)",
      button_background_hover: "rgba(255, 255, 255, 0.10)",
      frame_inactive: "rgb(28, 27, 34)",
      icons: "rgb(225, 225, 225)",
      ntp_background: "rgb(28, 27, 34)",
      ntp_text: "rgb(255, 255, 255)",
      popup_border: "rgba(0, 0, 0, 0)",
      sidebar_border: "rgba(0, 0, 0, 0)",
      tab_selected: "rgba(255, 255, 255, 0.15)",
      toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
      toolbar_field_border_focus: "rgb(70, 118, 160)",
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
    "about:devtools-toolbox": "rgb(249, 249, 250)",
    "about:debugging#": "rgb(249, 249, 250)"
  },
  "dark": {
    "about:privatebrowsing": "rgb(37, 0, 62)",
    "about:devtools-toolbox": "rgb(12, 12, 13)",
    "about:debugging#": "DEFAULT",
    "addons.mozilla.org": "rgb(32, 18, 58)"
  }
}

//Settings cache
var default_light_color = "#FFFFFF";
var default_dark_color = "#1C1B22";
var scheme;
var force;
var pref_custom;
var pref_light_color;
var pref_dark_color;

//Fired when the extension is first installed
//when the extension is updated to a new version
//and when the browser is updated to a new version
browser.runtime.onInstalled.addListener(init);

function init() {
  //browser.storage.local.set({force: true}); //v1.3.1 temporary fix
  browser.storage.local.get(function (pref) {
    scheme = pref.scheme;
    force = pref.force;
    pref_custom = pref.custom;
    pref_light_color = pref.light_color;
    pref_dark_color = pref.dark_color;
    if (scheme == undefined || force == undefined){ //first time install
      let init_scheme;
      if (window.matchMedia("(prefers-color-scheme: light)").matches){ //Read present theme to select color scheme
        init_scheme = "light";
        browser.browserSettings.overrideContentColorScheme.set({value: "light"});
      }else{
        init_scheme = "dark";
        browser.browserSettings.overrideContentColorScheme.set({value: "dark"});
      }
      browser.storage.local.set({scheme: init_scheme, force: false}).then(browser.runtime.openOptionsPage);
    }
    if (pref.last_version == undefined){ //updates from v1.3.1 to newer versions
      browser.storage.local.set({last_version: "v1.4.3", force: false});
    }
    if (pref_custom == undefined || pref_light_color == undefined || pref_dark_color == undefined){ //added from v1.3
      browser.storage.local.set({
        custom: false,
        light_color: default_light_color,
        dark_color: default_dark_color
      });
    }
    if (scheme == "system"){ //added from v1.4
      if (window.matchMedia('(prefers-color-scheme: dark)').matches){
        scheme = "dark";
      }else{
        scheme = "light";
      }
    }
    update();
  });
}

//Use port_ContentScript to speed things up
let port_cs;
browser.runtime.onConnect.addListener(function (port) {
  port_cs = port;
  port_cs.onMessage.addListener(function (msg, sender, sendResponse) {
    changeFrameColorTo(sender.sender.tab.windowId, msg.color, msg.darkMode);
  });
});

browser.tabs.onUpdated.addListener(update); //When new tab is opened / reloaded
browser.windows.onFocusChanged.addListener(update); //When new window is opened
chrome.runtime.onMessage.addListener(update); //When preferences changed
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", update); //When color scheme changes

update();

//updates pref cache and trigger color change
function update() {
  //console.log("Updated at " + Date.now());
  //browser.storage.local.set({force: true}); //v1.3.1 temporary fix
  chrome.tabs.query({active: true, status: "complete"}, function(tabs) {
    browser.storage.local.get(function (pref) {
      scheme = pref.scheme;
      force = pref.force;
      pref_custom = pref.custom;
      pref_light_color = pref.light_color;
      pref_dark_color = pref.dark_color;
      browser.browserSettings.overrideContentColorScheme.set({value: scheme});
      if (scheme == "system"){
        if (window.matchMedia("(prefers-color-scheme: dark)").matches){
          scheme = "dark";
        }else{
          scheme = "light";
        }
      }
      if (pref_custom){
        default_light_color = pref_light_color;
        default_dark_color = pref_dark_color;
      }else{
        default_light_color = "#FFFFFF";
        default_dark_color = "#1C1B22";
      }
      tabs.forEach(updateEachWindow);
    });
  });
}

function updateEachWindow(tab) {
  let url = tab.url;
  let windowId = tab.windowId;
  if (url.startsWith("file:")){
    if (scheme == "dark"){
      changeFrameColorTo(windowId, "rgb(56, 56, 61)", true);
    }else if (scheme == "light"){
      changeFrameColorTo(windowId, "rgb(249, 249, 250)", false);
    }
  }else if (url.startsWith("moz-extension:")){
    changeFrameColorTo(windowId, "", null);
  }else{
    let key = getSearchKey(url);
    let reversed_scheme = "light";
    if (scheme == "light") reversed_scheme = "dark";
    if (reservedColor[scheme][key] != null){ //For prefered scheme there's a reserved color
      changeFrameColorTo(windowId, reservedColor[scheme][key], scheme == "dark");
    }else if (reservedColor[reversed_scheme][key] != null){ //Site has reserved color in the other mode
      changeFrameColorTo(windowId, reservedColor[reversed_scheme][key], reversed_scheme == "dark");
    }else if (url.startsWith("about:") || url.startsWith("addons.mozilla.org")){
      changeFrameColorTo(windowId, "", null);
    }else{
      chrome.tabs.sendMessage(tab.id, {message: "remind_me"}, function(response) {
        if (response == undefined){
          console.log("No connection to content script")
        }
      });
    }
  }
}

//Change tab bar to the appointed color (with windowId);
//"darkMode" decides the color of the text;
//"force" and "scheme" come from preferences;
//force, scheme, darkMode;
//force: false => normal;
//force: true, scheme: dark, darkMode: true => normal;
//force: true, scheme: light, darkMode: false => normal;
//force: true, scheme: dark, darkMode: false => dark;
//force: true, scheme: light, darkMode: true => light;
//if color is empty, then roll back to default color;
function changeFrameColorTo(windowId, color, darkMode) {
  if (darkMode == null) darkMode = scheme == "dark";
  if (color == "" || color == null) { //gonna reset
    if (darkMode){
      adaptive_themes['dark']['colors']['frame'] = default_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = default_dark_color;
      adaptive_themes['dark']['colors']['popup'] = default_dark_color;
      adaptive_themes['dark']['colors']['ntp_background'] = default_dark_color;
      applyTheme(windowId, adaptive_themes['dark']);
    }else{
      adaptive_themes['light']['colors']['frame'] = default_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = default_light_color;
      adaptive_themes['light']['colors']['popup'] = default_light_color;
      adaptive_themes['light']['colors']['ntp_background'] = default_light_color;
      applyTheme(windowId, adaptive_themes['light']);
    }
  }else if (!force || (force && scheme == "dark" && darkMode) || (force && scheme == "light" && !darkMode)){ //normal coloring
    if (darkMode){
      if (color == "DEFAULT") color = default_dark_color;
      adaptive_themes['dark']['colors']['frame'] = color;
      adaptive_themes['dark']['colors']['frame_inactive'] = color;
      adaptive_themes['dark']['colors']['popup'] = color;
      applyTheme(windowId, adaptive_themes['dark']);
    }else{
      if (color == "DEFAULT") color = default_light_color;
      adaptive_themes['light']['colors']['frame'] = color;
      adaptive_themes['light']['colors']['frame_inactive'] = color;
      adaptive_themes['light']['colors']['popup'] = color;
      applyTheme(windowId, adaptive_themes['light']);
    }
  }else if (force){ //force coloring
    if (!darkMode){
      adaptive_themes['dark']['colors']['frame'] = default_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = default_dark_color;
      adaptive_themes['dark']['colors']['popup'] = default_dark_color;
      applyTheme(windowId, adaptive_themes['dark']);
    }else{
      adaptive_themes['light']['colors']['frame'] = default_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = default_light_color;
      adaptive_themes['light']['colors']['popup'] = default_light_color;
      applyTheme(windowId, adaptive_themes['light']);
    }
  }
}

//Apply theme (with windowId)
function applyTheme(windowId, theme) {
  browser.theme.update(windowId, theme);
}

function getSearchKey(url) {
  let key = "";
  if (url.startsWith("about:")){
    key = url.split(/\/|\?/)[0]; //e.g. key can be "about:blank"
  }else{
    key = url.split(/\/|\?/)[2]; // e.g. key can be "addons.mozilla.org"
  }
  return key;
}