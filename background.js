
browser.runtime.onInstalled.addListener(startup);

chrome.tabs.onUpdated.addListener(startup);

chrome.tabs.onActivated.addListener(startup);

const default_themes = {
  colors: {
    toolbar: "rgba(0, 0, 0, 0)",
    toolbar_text: "rgb(255, 255, 255)",
    frame: "rgb(55, 55, 55)",
    tab_background_text: "rgb(226, 226, 226)",
    toolbar_field: "rgb(0, 2, 4)",
    toolbar_field_text: "rgb(255, 255, 255)",
    tab_line: "rgba(0, 0, 0, 0)",
    popup: "rgb(40, 40, 40)",
    popup_text: "rgb(225, 225, 225)",
    button_background_active: "rgb(125, 125, 125)",
    button_background_hover: "rgb(115, 115, 115)",
    frame_inactive: "rgb(55, 55, 55)",
    icons: "rgb(225, 225, 225)",
    ntp_background: "rgb(55, 55, 55)",
    ntp_text: "rgb(255, 255, 255)",
    popup_border: "rgba(0, 0, 0, 0)",
    sidebar_border: "rgba(0, 0, 0, 0)",
    tab_selected: "rgb(90, 90, 90)",
    toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
    toolbar_field_border_focus: "rgb(70, 118, 160)",
    toolbar_top_separator: "rgba(0, 0, 0, 0)",
    tab_loading: "rgba(0, 0, 0, 0)",
  }
};

adaptive_themes = {
  colors: {
    toolbar: "rgba(0, 0, 0, 0)",
    toolbar_text: "rgb(255, 255, 255)",
    frame: "rgb(55, 55, 55)",
    tab_background_text: "rgb(226, 226, 226)",
    toolbar_field: "rgb(0, 2, 4)",
    toolbar_field_text: "rgb(255, 255, 255)",
    tab_line: "rgba(0, 0, 0, 0)",
    popup: "rgb(40, 40, 40)",
    popup_text: "rgb(225, 225, 225)",
    button_background_active: "rgb(125, 125, 125)",
    button_background_hover: "rgb(115, 115, 115)",
    frame_inactive: "rgb(40, 40, 40)",
    icons: "rgb(225, 225, 225)",
    ntp_background: "rgb(55, 55, 55)",
    ntp_text: "rgb(255, 255, 255)",
    popup_border: "rgba(0, 0, 0, 0)",
    sidebar_border: "rgba(0, 0, 0, 0)",
    tab_selected: "rgb(90, 90, 90)",
    toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
    toolbar_field_border_focus: "rgb(70, 118, 160)",
    toolbar_top_separator: "rgba(0, 0, 0, 0)",
    tab_loading: "rgba(0, 0, 0, 0)",
  }
};

function startup() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if(tabs[0].url.startsWith("about:") && tabs[0].url != "about:newtab"){
      changeFrameColorTo("rgb(28, 27, 34)");
    }else{
      changeFrameColorToBackground();
    }
  });
  
}

function changeFrameColorToBackground() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {message: 'background_color'}, function(response) {
      console.log("Request sent to " + tabs[0].url);
      if (response != undefined){
        console.log("Response: " + response.value);
        if (!response.value.includes('rgba') || tabs[0].url.startsWith("https://www.youtube.com/")){
          changeFrameColorTo(response.value);
        }else{
          browser.theme.update(default_themes);
          console.log("Fallback to default.");
        }
      }else{
        browser.theme.update(default_themes);
        console.log("No response, might be newtab.");
      }
    });
  });
}

function changeFrameColorTo(color) {
  adaptive_themes['colors']['frame'] = color;
  adaptive_themes['colors']['frame_inactive'] = color;
  browser.theme.update(adaptive_themes);
}