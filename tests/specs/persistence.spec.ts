import { sleep } from "selenium-webext-bridge";
import type { TestCase } from "../helpers/types.js";

export const testCase: TestCase = {
	name: "Preference Persistence",
	async run({ driver, results, optionsUrl }) {
		try {
			const original = await driver.executeScript(async () => {
				const data = await browser.storage.local.get("tabbar");
				return data.tabbar;
			});

			await driver.executeScript(async () => {
				await browser.storage.local.set({ tabbar: 25 });
			});

			await driver.get(optionsUrl);
			await sleep(1000);

			const stored = await driver.executeScript(async () => {
				const data = await browser.storage.local.get("tabbar");
				return data.tabbar;
			});

			if (stored === 25) {
				results.pass("Preference persistence");
			} else {
				results.fail("Preference persistence", `got: ${stored}`);
			}

			await driver.executeScript(async (val: number) => {
				await browser.storage.local.set({ tabbar: val });
			}, original);
		} catch (e) {
			results.error("Preference persistence", e);
		}
	},
};
