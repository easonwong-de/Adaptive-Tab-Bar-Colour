
browser.runtime.onInstalled.addListener(startup);
chrome.tabs.onUpdated.addListener(startup);
chrome.tabs.onActivated.addListener(startup);

const default_theme = {
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
};

adaptive_themes = {
  'light': {
    colors: {
      toolbar: "rgba(0, 0, 0, 0)",
      toolbar_text: "rgb(0, 0, 0)",
      frame: "rgb(255, 255, 255)",
      tab_background_text: "rgb(30, 30, 30)",
      toolbar_field: "rgb(220, 220, 220)",
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
      toolbar_field_border_focus: "rgb(70, 118, 160)",
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

function startup() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let tab = tabs[0];
    if (tab.url.startsWith("about:")){
      applyTheme(default_theme); //Use default color in browser-owned pages
    }else{
      changeFrameColorToBackground();
    }
  });
}

// Colorize tab bar after defined theme-color or computed background color
function changeFrameColorToBackground() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {message: 'background_color'}, function(response) {
      let tab = tabs[0];
      console.log("Request sent to " + tab.url);
      if (response != undefined){
        console.log("Response color: " + response.color + ", in dark mode: " + response.darkMode);
        changeFrameColorTo(response.color, response.darkMode);
      }else{
        applyTheme(default_theme);
        console.log("No response.");
      }
    });
  });
}

//Change tab bar to appointed color
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

//Apply theme
function applyTheme(theme) {
  console.log("Change color to: " + theme['colors']['frame']);
  browser.theme.update(theme);
}