
response = "";

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message == 'background_color'){
			if (document.querySelector('meta[name="theme-color"]') != null){
				response = document.querySelector('meta[name="theme-color"]').content;
			}else{
				response = window.getComputedStyle(document.body,null).getPropertyValue('background-color');
			}
			sendResponse({value: response});
		}
	}
);
