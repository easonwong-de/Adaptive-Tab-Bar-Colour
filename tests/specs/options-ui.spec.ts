import { sleep } from "selenium-webext-bridge";
import type { TestCase } from "../helpers/types.js";

export const testCase: TestCase = {
	name: "Options Page",
	async run({ driver, results, optionsUrl }) {
		await driver.get(optionsUrl);
		await sleep(1500);

		try {
			const tabCount = await driver.executeScript(() => {
				return document.querySelectorAll(
					'.tab-switch-wrapper input[name="tab-switch"]',
				).length;
			});
			if (tabCount === 3) {
				results.pass("Options page loads with three tabs");
			} else {
				results.fail(
					"Options page loads with three tabs",
					`found ${tabCount}`,
				);
			}
		} catch (e) {
			results.error("Options page loads with three tabs", e);
		}

		try {
			const sliderPrefs = (await driver.executeScript(() => {
				const sliders = document.querySelectorAll(
					"#tab-1 .slider[data-pref]",
				);
				return Array.from(sliders).map(
					(s) => (s as HTMLElement).dataset.pref,
				);
			})) as string[];
			const expected = [
				"tabSelected",
				"tabSelectedBorder",
				"tabbar",
				"tabbarBorder",
				"popup",
				"popupBorder",
				"toolbarField",
				"toolbarFieldOnFocus",
				"toolbarFieldBorder",
				"toolbar",
				"toolbarBorder",
				"sidebar",
				"sidebarBorder",
			];
			const hasAll = expected.every((p) => sliderPrefs.includes(p));
			if (hasAll) {
				results.pass("All theme sliders found");
			} else {
				results.fail(
					"All theme sliders found",
					`missing: ${expected.filter((p) => !sliderPrefs.includes(p)).join(", ")}`,
				);
			}
		} catch (e) {
			results.error("All theme sliders found", e);
		}
	},
};
