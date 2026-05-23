import type { TestCase } from "../helpers/types.js";

const expectedPrefs: Record<string, unknown> = {
	popup: 5,
	popupBorder: 10,
	sidebar: 5,
	sidebarBorder: 10,
	tabbar: 0,
	tabbarBorder: 0,
	tabSelected: 15,
	tabSelectedBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	ruleList: {},
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
};

export const testCase: TestCase = {
	name: "Initialise Preferences",
	async run({ driver, results }) {
		try {
			expectedPrefs.compatibilityMode = (await driver.executeScript(
				async () => {
					return typeof browser.theme?.update === "function";
				},
			)) as boolean;

			const { lastSave, version, ...actualPrefs } =
				(await driver.executeScript(async () => {
					return await browser.storage.local.get();
				})) as Record<string, unknown>;
			void lastSave;
			void version;

			const expectedKeys = Object.keys(expectedPrefs);
			const actualKeys = Object.keys(actualPrefs);
			const missingKeys = expectedKeys.filter(
				(key) => !(key in actualPrefs),
			);
			const extraKeys = actualKeys.filter(
				(key) => !(key in expectedPrefs),
			);

			if (missingKeys.length === 0) {
				results.pass("Preferences defaults keys: missing");
			} else {
				results.fail(
					"Preferences defaults keys: missing",
					missingKeys.join(", "),
				);
			}

			if (extraKeys.length === 0) {
				results.pass("Preferences defaults keys: extra");
			} else {
				results.fail(
					"Preferences defaults keys: extra",
					extraKeys.join(", "),
				);
			}

			for (const key of expectedKeys) {
				const actualValue = actualPrefs[key];
				const expectedValue = expectedPrefs[key];
				if (actualValue === expectedValue) {
					results.pass(`Preferences defaults value: ${key}`);
				} else {
					results.fail(
						`Preferences defaults value: ${key}`,
						`got: ${JSON.stringify(actualValue)}`,
					);
				}
			}
		} catch (e) {
			results.error("Preferences defaults", e);
		}
	},
};
