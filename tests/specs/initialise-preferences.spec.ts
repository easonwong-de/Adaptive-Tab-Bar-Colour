import { sleep } from "selenium-webext-bridge";
import type { TestCase } from "../types.js";
import { compareRecord } from "../utils.js";

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
	popup: 5,
	popupBorder: 10,
	ruleList: {},
	sidebar: 5,
	sidebarBorder: 10,
	tabSelected: 15,
	tabSelectedBorder: 0,
	tabbar: 0,
	tabbarBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	version: [4, 0],
};

export const testCase: TestCase = {
	name: "Initialise Preferences",
	async run({ driver, results, optionsUrl }) {
		try {
			await driver.get(optionsUrl);
			await sleep(500);

			expectedPrefs.compatibilityMode = (await driver.executeScript(
				() => {
					return typeof browser?.theme?.update !== "function";
				},
			)) as boolean;

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
				results.pass("No missing default preference keys");
			} else {
				results.fail(
					"Missing default preference key(s)",
					missingKeys.join(", "),
				);
			}

			if (extraKeys.length === 0) {
				results.pass("No extra default preference keys");
			} else {
				results.fail(
					"Extra default preference key(s)",
					extraKeys.join(", "),
				);
			}

			if (wrongValues.length === 0) {
				results.pass("All preference default values match expected");
			} else {
				for (const wrongValue of wrongValues) {
					results.fail(
						"Wrong default preference value(s)",
						wrongValue,
					);
				}
			}
		} catch (error) {
			results.error("Initialise Preferences", error);
		}
	},
};
