import type { TestCase } from "../helpers/types.js";

export const testCase: TestCase = {
	name: "Default Preferences",
	async run({ driver, results }) {
		try {
			const prefs = (await driver.executeScript(async () => {
				return await browser.storage.local.get();
			})) as Record<string, any>;

			if (prefs.dynamic === true) {
				results.pass("Dynamic mode defaults to enabled");
			} else {
				results.fail(
					"Dynamic mode defaults to enabled",
					`dynamic: ${prefs.dynamic}`,
				);
			}

			if (prefs.allowDarkLight === true) {
				results.pass("Allow dark/light enabled by default");
			} else {
				results.fail(
					"Allow dark/light enabled by default",
					`allowDarkLight: ${prefs.allowDarkLight}`,
				);
			}

			if (prefs.tabbar === 0 && prefs.toolbar === 0) {
				results.pass("Sliders default to zero");
			} else {
				results.fail(
					"Sliders default to zero",
					`tabbar: ${prefs.tabbar}, toolbar: ${prefs.toolbar}`,
				);
			}
		} catch (e) {
			results.error("Settings defaults", e);
		}
	},
};
