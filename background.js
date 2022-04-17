adaptive_themes = {
  'light': {
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
  'dark': {
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

browser.runtime.onInstalled.addListener(function () {
  browser.storage.local.get("scheme", function (obj) {
    scheme = obj.scheme;
    if (scheme == undefined || scheme.length == 0){ //Read present theme to select color scheme
      if (window.matchMedia("(prefers-color-scheme: light)").matches){
        browser.storage.local.set({scheme: "light"});
      }else{
        browser.storage.local.set({scheme: "dark"});
      }
      browser.runtime.openOptionsPage();
    }
  });
  onTabUpdate();
});

//chrome.tabs.onUpdated.addListener(onTabUpdate);
chrome.tabs.onActivated.addListener(onTabUpdate);

let port_cs;

browser.runtime.onConnect.addListener(function (port) {
  port_cs = port;
  port_cs.onMessage.addListener(function (response) {
      console.log("+++EXPRESS RESPONSE+++ Response color: " + response.color + ", in dark mode: " + response.darkMode);
      changeFrameColorTo(response.color, response.darkMode);
    });
});

function onTabUpdate() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let tab = tabs[0];
    if (tab.url.startsWith("about:")){
      //Use default color in browser-owned pages
      //In this case, content script can't work
      resetFrameColor();
    }else{
      changeFrameColorToBackground();
    }
  });
}

// Colorize tab bar after defined theme-color or computed background color
function changeFrameColorToBackground() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {message: 'remind_me'}, function(response) {
      let tab = tabs[0];
      if (response != undefined){
        console.log(tab.url + " Response color: " + response.color + ", in dark mode: " + response.darkMode);
        changeFrameColorTo(response.color, response.darkMode);
      }else{
        resetFrameColor();
        console.log("LOST CONNECTION TO CONTENT SCRIPT");
      }
    });
  });
}

//Change tab bar to the appointed color
function changeFrameColorTo(color, darkMode) {
  if (darkMode){
    adaptive_themes['dark']['colors']['frame'] = color;
    adaptive_themes['dark']['colors']['frame_inactive'] = color;
    adaptive_themes['dark']['colors']['popup'] = color;
    applyTheme(adaptive_themes['dark']);
  }else{
    adaptive_themes['light']['colors']['frame'] = color;
    adaptive_themes['light']['colors']['frame_inactive'] = color;
    adaptive_themes['light']['colors']['popup'] = color;
    applyTheme(adaptive_themes['light']);
  }
}

//Reset frame color when something bad happens
function resetFrameColor() {
  browser.storage.local.get("scheme", function (obj) {
    if (obj.scheme == "dark"){
      changeFrameColorTo("rgb(28, 27, 34)", true);
    }else{
      changeFrameColorTo("rgb(255, 255, 255)", false);
    }
  });
}

//Apply theme
function applyTheme(theme) {
  browser.theme.update(theme);
}

//When prefered scheme changed
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request == "apply_settings") resetFrameColor();
});