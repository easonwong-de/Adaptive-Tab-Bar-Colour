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

var default_light_color = "#FFFFFF";
var default_dark_color = "#1C1B22";

//When first installed, detect which mode the user is using
browser.runtime.onInstalled.addListener(init);

function init() {
  browser.storage.local.set({force: true}); //v1.3.1 temporary fix
  browser.storage.local.get(function (pref) {
    let scheme = pref.scheme;
    let force = pref.force;
    let pref_custom = pref.custom;
    let pref_light_color = pref.light_color;
    let pref_dark_color = pref.dark_color;
    if (scheme == undefined || force == undefined){
      if (window.matchMedia("(prefers-color-scheme: light)").matches){ //Read present theme to select color scheme
        browser.storage.local.set({scheme: "light", force: true});
      }else{
        browser.storage.local.set({scheme: "dark", force: true});
      }
      if (pref_custom == undefined || pref_light_color == undefined || pref_dark_color == undefined){
        browser.storage.local.set({
          custom: false,
          light_color: default_light_color,
          dark_color: default_dark_color
        });
      }
      browser.runtime.openOptionsPage();
    }
    update();
  });
}

//Use port_ContentScript to speed things up
let port_cs;
browser.runtime.onConnect.addListener(function (port) {
  port_cs = port;
  port_cs.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("+++EXPRESS MESSAGE+++ \nWindow ID: " + sender.sender.tab.windowId + "\nColor: " + msg.color + "\nIn dark mode: " + msg.darkMode);
    changeFrameColorTo(sender.sender.tab.windowId, msg.color, msg.darkMode);
  });
});

chrome.tabs.onUpdated.addListener(update);
browser.windows.onFocusChanged.addListener(update);

function update() {
  browser.storage.local.set({force: true}); //v1.3.1 temporary fix
  chrome.tabs.query({active: true, currentWindow: true, status: "complete"}, function(tabs) {
    let url = tabs[0].url;
    let windowId = tabs[0].windowId;
    browser.storage.local.get(function (pref) {
      let pref_custom = pref.custom;
      let pref_light_color = pref.light_color;
      let pref_dark_color = pref.dark_color;
      if (pref_custom){
        default_light_color = pref_light_color;
        default_dark_color = pref_dark_color;
      }else{
        default_light_color = "#FFFFFF";
        default_dark_color = "#1C1B22";
      }
      if (url.startsWith("file:")){
        if (pref.scheme == "dark"){
          changeFrameColorTo(windowId, "rgb(56, 56, 61)", true);
        }else if (pref.scheme == "light"){
          changeFrameColorTo(windowId, "rgb(249, 249, 250)", false);
        }
      }else{
        let key = "";
        let scheme = pref.scheme;
        let reversed_scheme = "light";
        if (scheme == "light") reversed_scheme = "dark";
        if (url.startsWith("about:")){
          key = url.split(/\/|\?/)[0]; //e.g. key can be "about:blank"
        }else{
          key = url.split(/\/|\?/)[2]; // e.g. key can be "addons.mozilla.org"
        }
        if (reservedColor[scheme][key] != null){ //For prefered scheme there's a reserved color
          changeFrameColorTo(windowId, reservedColor[scheme][key], scheme == "dark");
        }else if (reservedColor[reversed_scheme][key] != null){ //Site has reserved color in the other mode
          changeFrameColorTo(windowId, reservedColor[reversed_scheme][key], reversed_scheme == "dark");
        }else{
          //For normal websites where content script can be injected
          changeFrameColorToBackground();
        }
      }
    });
  });
}

// Colorize tab bar after defined theme-color or computed background color
function changeFrameColorToBackground() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {message: 'remind_me'}, function(response) {
      let url = tabs[0].url;
      let windowId = tabs[0].windowId;
      if (response != undefined){
        //console.log("Changing color\nWindow ID: " + windowId + "\nURL: " + url + "\nColor: " + response.color + "\nIn dark mode: " + response.darkMode);
        changeFrameColorTo(windowId, response.color, response.darkMode);
      }else{
        resetFrameColor(windowId);
        console.log("NO CONNECTION TO CONTENT SCRIPT\nMay be about:pages");
      }
    });
  });
}

//Reset frame color when something unexpected happens (with windowId)
function resetFrameColor(windowId) {
  browser.storage.local.get(function (pref) {
    if (pref.scheme == "light"){
      changeFrameColorTo(windowId, default_light_color, false);
    }else{
      changeFrameColorTo(windowId, default_dark_color, true);
    }
  });
}

//Change tab bar to the appointed color (with windowId)
//"darkMode" decides the color of the text & url bar
//force, scheme, darkMode
//force: false => normal
//force: true, scheme: dark, darkMode: true => normal
//force: true, scheme: light, darkMode: false => normal
//force: true, scheme: dark, darkMode: false => dark
//force: true, scheme: light, darkMode: true => light
function changeFrameColorTo(windowId, color, darkMode) {
  browser.storage.local.get(function (pref) {
    let scheme = pref.scheme;
    let force = pref.force;
    if (darkMode == null) darkMode = scheme == "dark";
    if (!force || (force && scheme == "dark" && darkMode) || (force && scheme == "light" && !darkMode)){
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
    }else if (force && scheme == "dark" && !darkMode){
      adaptive_themes['dark']['colors']['frame'] = default_dark_color;
      adaptive_themes['dark']['colors']['frame_inactive'] = default_dark_color;
      adaptive_themes['dark']['colors']['popup'] = default_dark_color;
      applyTheme(windowId, adaptive_themes['dark']);
    }else if (force && scheme == "light" && darkMode){
      adaptive_themes['light']['colors']['frame'] = default_light_color;
      adaptive_themes['light']['colors']['frame_inactive'] = default_light_color;
      adaptive_themes['light']['colors']['popup'] = default_light_color;
      applyTheme(windowId, adaptive_themes['light']);
    }
  });
}

//Apply theme (with windowId)
function applyTheme(windowId, theme) {
  browser.theme.update(windowId, theme);
}

//When prefered scheme changed
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request == "apply_settings") update();
});

/*browser.storage.local.get(function (pref) {
  console.log(pref.scheme + "\n" + pref.force);
});*/