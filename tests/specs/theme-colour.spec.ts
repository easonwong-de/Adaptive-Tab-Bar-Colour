import { sleep } from "selenium-webext-bridge";
import type { TestCase } from "../helpers/types.js";
import { colorsDiffer, getFrameColor } from "../helpers/utils.js";

export const testCase: TestCase = {
	name: "Apply Themes",
	async run({ driver, bridge, results }) {
		await bridge.reset();
		await driver.get("http://127.0.0.1:8080/white?bg=%23ffffff");
		await sleep(2000);

		let whiteFrame: string | null = null;
		try {
			whiteFrame = await getFrameColor(driver);
			if (whiteFrame) {
				results.pass(
					`Applies a frame color on page load (${whiteFrame})`,
				);
			} else {
				results.fail(
					"Applies a frame color on page load",
					"no --lwt-accent-color set",
				);
			}
		} catch (e) {
			results.error("Applies a frame color on page load", e);
		}

		await driver.get("http://127.0.0.1:8080/blue?bg=%23aaccff");
		await sleep(2000);

		try {
			const blueFrame = await getFrameColor(driver);
			if (
				whiteFrame &&
				blueFrame &&
				colorsDiffer(whiteFrame, blueFrame)
			) {
				results.pass(
					`Different page produces different frame color (${blueFrame})`,
				);
			} else {
				results.fail(
					"Different page produces different frame color",
					`white: ${whiteFrame}, blue: ${blueFrame}`,
				);
			}
		} catch (e) {
			results.error("Different page produces different frame color", e);
		}
	},
};
