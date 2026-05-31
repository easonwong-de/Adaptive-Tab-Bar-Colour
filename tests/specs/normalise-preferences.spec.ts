import { sleep } from "selenium-webext-bridge";
import type { TestCase } from "../types.js";
import { compareRecord } from "../utils.js";

const importedPrefs: Record<string, unknown> = {
	allowDarkLight: true,
	compatibilityMode: false,
	dynamic: 10, // Type mismatch
	extra: true, // Extra key
	fallbackColour_dark: "#2b2a33",
	fallbackColour_light: "#ffffff",
	homeBackground_dark: "#2b2a33",
	homeBackground_light: "#ffffff",
	/* minContrast_dark: 45, */ // Missing key
	minContrast_light: 90,
	noThemeColour: true,
	popup: 10,
	popupBorder: 100, // Out of bounce
	sidebar: 10,
	sidebarBorder: 10,
	siteList: {
		"1": {
			header: "example-1.com",
			headerType: "URL",
			type: "COLOUR",
			value: "#33214e",
		},
		"2": {
			header: "example-2.com",
			headerType: "URL",
			type: "THEME_COLOUR",
			value: false,
		},
		"3": {
			header: "example-3.com",
			headerType: "URL",
			type: "QUERY_SELECTOR",
			value: "body",
		},
		"4": {
			header: "example-4.com",
			headerType: "URL",
			type: "COLOUR",
			value: "red", // Non-standard colour
		},
	},
	tabSelected: 15,
	tabSelectedBorder: 10,
	tabbar: 10,
	tabbarBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	version: [3, 3, 2],
};

const expectedPrefs: Record<string, unknown> = {
	accentColour_dark: "#00cadb",
	accentColour_light: "#0062fa",
	allowDarkLight: true,
	compatibilityMode: false,
	dynamic: true,
	fallbackColour_dark: "#2b2a33",
	fallbackColour_light: "#ffffff",
	homeBackground_dark: "#2b2a33",
	homeBackground_light: "#ffffff",
	minContrast_dark: 45,
	minContrast_light: 90,
	noThemeColour: true,
	overwriteAccentColour: false,
	popup: 10,
	popupBorder: 50,
	ruleList: {
		"1": {
			header: "example-1.com",
			headerType: "URL",
			scheme: "both",
			type: "COLOUR",
			value: "#33214e",
		},
		"2": {
			header: "example-2.com",
			headerType: "URL",
			scheme: "both",
			type: "THEME_COLOUR",
			value: false,
		},
		"3": {
			header: "example-3.com",
			headerType: "URL",
			scheme: "both",
			type: "QUERY_SELECTOR",
			value: "body",
		},
		"4": {
			header: "example-4.com",
			headerType: "URL",
			scheme: "both",
			type: "COLOUR",
			value: "#ff0000",
		},
	},
	sidebar: 10,
	sidebarBorder: 10,
	tabSelected: 15,
	tabSelectedBorder: 10,
	tabbar: 10,
	tabbarBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	version: [4, 0],
};

export const testCase: TestCase = {
	name: "Normalise Preferences",
	async run({ driver, results, optionsUrl }) {
		try {
			await driver.get(optionsUrl);
			await sleep(500);

			await driver.executeScript(async () => {
				await browser.storage.local.set(arguments[0]);
			}, importedPrefs);

			await driver.navigate().refresh();
			await sleep(500);

			const { lastSave, ...actualPrefs } = (await driver.executeScript(
				async () => {
					return await browser.storage.local.get();
				},
			)) as Record<string, unknown>;

			const {
				extraKeys1: missingKeys,
				extraKeys2: extraKeys,
				mismatchedValues: wrongValues,
			} = compareRecord(expectedPrefs, actualPrefs);

			if (missingKeys.length === 0) {
				results.pass("No missing preference keys");
			} else {
				results.fail(
					"Missing preference key(s)",
					missingKeys.join(", "),
				);
			}

			if (extraKeys.length === 0) {
				results.pass("No extra preference keys");
			} else {
				results.fail("Extra preference key(s)", extraKeys.join(", "));
			}

			if (wrongValues.length === 0) {
				results.pass("All preference values match expected");
			} else {
				for (const wrongValue of wrongValues) {
					results.fail("Wrong preference value(s)", wrongValue);
				}
			}
		} catch (error) {
			results.error("Normalise Preferences", error);
		}
	},
};
