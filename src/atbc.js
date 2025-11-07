var query = null;

const sendColour = (() => {
	let timeout,
		lastCall = 0;
	const limitMs = 250;
	const action = async () =>
		document.visibilityState === "visible" &&
		browser.runtime.sendMessage({
			header: "UPDATE_COLOUR",
			response: getColour(),
		});
	return async () => {
		const now = Date.now();
		clearTimeout(timeout);
		const delay = limitMs - (now - lastCall);
		if (delay <= 0) ((lastCall = now), await action());
		else
			timeout = setTimeout(
				async () => ((lastCall = Date.now()), await action()),
				delay,
			);
	};
})();

function sendColourRequiresFocus() {
	if (document.hasFocus()) sendColour();
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.header) {
		case "GET_COLOUR":
			message.dynamic ? enableDynamic() : disableDynamic();
			query = message.query;
			sendResponse(getColour());
			break;
		case "SET_THEME_COLOUR":
			setThemeColour(message.colour);
			break;
		default:
			break;
	}
});

function getColour() {
	return {
		theme: getThemeColour(),
		header: getHeaderColour(),
		query: getQueryColour(),
	};
}

function setThemeColour(colour) {
	const metaThemeColourLight =
		document.querySelector(
			`meta[name="theme-color"][media="(prefers-color-scheme: light)"]`,
		) ?? document.querySelector(`meta[name="theme-color"]`);
	const metaThemeColourDark =
		document.querySelector(
			`meta[name="theme-color"][media="(prefers-color-scheme: dark)"]`,
		) ?? document.querySelector(`meta[name="theme-color"]`);
	if (metaThemeColourLight && metaThemeColourDark) {
		metaThemeColourLight.content = colour;
		metaThemeColourDark.content = colour;
	} else {
		const metaTag = document.createElement("meta");
		metaTag.name = "theme-color";
		metaTag.content = colour;
		document.head.appendChild(metaTag);
	}
}

function getThemeColour() {
	const metaThemeColourLight =
		document.querySelector(
			`meta[name="theme-color"][media="(prefers-color-scheme: light)"]`,
		) ?? document.querySelector(`meta[name="theme-color"]`);
	const metaThemeColourDark =
		document.querySelector(
			`meta[name="theme-color"][media="(prefers-color-scheme: dark)"]`,
		) ?? document.querySelector(`meta[name="theme-color"]`);
	return {
		light: metaThemeColourLight?.content,
		dark: metaThemeColourDark?.content,
	};
}

function getHeaderColour() {
	return document
		.elementsFromPoint(window.innerWidth / 2, 3)
		.map((element) => getElementColour(element))
		.filter((colour) => colour !== undefined);
}

function getQueryColour(query) {
	return query ? getElementColour(querySelector(query)) : undefined;
}

function getElementColour(element) {
	if (element instanceof Element) {
		const style = getComputedStyle(element);
		return {
			colour: style.backgroundColor,
			opacity: style.opacity,
			filter: style.filter,
		};
	}
}

const originalThemeColour = getThemeColour();

const darkReaderObserver = new MutationObserver(sendColour);
const metaTagObserver = new MutationObserver(sendColour);
const newMetaTagObserver = new MutationObserver((mutationList) =>
	mutationList.forEach((mutation) => {
		mutation.addedNodes.forEach((node) => {
			if (node.nodeName === "META" && node.name === "theme-color") {
				sendColour();
				metaTagObserver.observe(node, {
					attributes: true,
				});
			}
		});
	}),
);
const styleTagObserver = new MutationObserver((mutationList) => {
	if (
		mutationList.some((mutation) =>
			[...mutation.addedNodes, ...mutation.removedNodes].some(
				(node) => node.nodeName === "STYLE",
			),
		)
	) {
		sendColour();
	}
});

function enableDynamic() {
	["click", "resize", "scroll", "visibilitychange"].forEach((event) =>
		document.addEventListener(event, sendColour),
	);
	[
		"transitionend",
		"transitioncancel",
		"animationend",
		"animationcancel",
	].forEach((transitionEvent) =>
		document.addEventListener(transitionEvent, sendColourRequiresFocus),
	);
	darkReaderObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-darkreader-mode"],
	});
	document
		.querySelectorAll("meta[name=theme-color]")
		.forEach((metaTag) =>
			metaTagObserver.observe(metaTag, { attributes: true }),
		);
	newMetaTagObserver.observe(document.head, { childList: true });
	styleTagObserver.observe(document.documentElement, { childList: true });
	styleTagObserver.observe(document.head, { childList: true });
}

function disableDynamic() {
	["click", "resize", "scroll", "visibilitychange"].forEach((event) =>
		document.removeEventListener(event, sendColour),
	);
	[
		"transitionend",
		"transitioncancel",
		"animationend",
		"animationcancel",
	].forEach((transitionEvent) =>
		document.removeEventListener(transitionEvent, sendColourRequiresFocus),
	);
	darkReaderObserver.disconnect();
	metaTagObserver.disconnect();
	newMetaTagObserver.disconnect();
	styleTagObserver.disconnect();
}

(function sendMessageOnLoad(attempt = 0) {
	try {
		browser.runtime.sendMessage({ header: "SCRIPT_LOADED" });
	} catch {
		const maxAttempts = 3;
		if (attempt >= maxAttempts) {
			console.error("Could not connect to ATBC background.");
		} else {
			console.warn("Failed to connect to ATBC background.");
		}
		setTimeout(() => sendMessageOnLoad(++attempt), 50);
	}
})();
