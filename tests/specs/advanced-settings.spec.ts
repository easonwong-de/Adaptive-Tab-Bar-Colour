import { sleep } from "selenium-webext-bridge";
import type { TestCase } from "../helpers/types.js";

export const testCase: TestCase = {
	name: "Advanced Settings",
	async run({ driver, results }) {
		await driver.executeScript(() => {
			document.getElementById("tab-switch-3")?.click();
		});
		await sleep(500);

		try {
			const checkboxPrefs = (await driver.executeScript(() => {
				const cbs = document.querySelectorAll(
					'#tab-3 input[type="checkbox"][data-pref]',
				);
				return Array.from(cbs).map(
					(cb) => (cb as HTMLElement).dataset.pref,
				);
			})) as string[];
			const expected = [
				"allowDarkLight",
				"dynamic",
				"noThemeColour",
				"compatibilityMode",
			];
			const hasAll = expected.every((p) => checkboxPrefs.includes(p));
			if (hasAll) {
				results.pass("Advanced tab has all 4 setting checkboxes");
			} else {
				results.fail(
					"Advanced tab has all 4 setting checkboxes",
					`found: ${checkboxPrefs.join(", ")}`,
				);
			}
		} catch (e) {
			results.error("Advanced tab has all 4 setting checkboxes", e);
		}

		try {
			const colorPrefs = (await driver.executeScript(() => {
				const wrappers = document.querySelectorAll(
					"#tab-3 .colour-input-wrapper[data-pref]",
				);
				return Array.from(wrappers).map(
					(w) => (w as HTMLElement).dataset.pref,
				);
			})) as string[];
			const expected = [
				"homeBackground_light",
				"homeBackground_dark",
				"fallbackColour_light",
				"fallbackColour_dark",
			];
			const hasAll = expected.every((p) => colorPrefs.includes(p));
			if (hasAll) {
				results.pass("Advanced tab color inputs: home and fallback");
			} else {
				results.fail(
					"Advanced tab color inputs: home and fallback",
					`found: ${colorPrefs.join(", ")}`,
				);
			}
		} catch (e) {
			results.error("Advanced tab color inputs: home and fallback", e);
		}
	},
};
