
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

adaptive_theme = {
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
        console.log("Response: " + response.value);
        if (!response.value.includes('rgba') || tab.url.startsWith("https://www.youtube.com/")){
          changeFrameColorTo(response.value);
        }else{
          applyTheme(default_theme);
          console.log("Fallback to default.");
        }
      }else{
        applyTheme(default_theme);
        console.log("No response.");
      }
    });
  });
}

//Change tab bar to appointed color
function changeFrameColorTo(color) {
  adaptive_theme['colors']['frame'] = color;
  adaptive_theme['colors']['frame_inactive'] = color;
  adaptive_theme['colors']['popup'] = color;
  applyTheme(adaptive_theme);
}

//Change theme
function applyTheme(theme) {
  //console.log("Colorizing window No. " + browser.windows.WINDOW_ID_CURRENT);
  browser.theme.update(theme);
}