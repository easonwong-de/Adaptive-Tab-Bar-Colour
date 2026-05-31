import { sleep } from "selenium-webext-bridge";
import type { TestCase } from "../types.js";
import { compareColour, getFrameColour } from "../utils.js";

export const testCase: TestCase = {
	name: "Basic Apply Theme",
	async run({ driver, bridge, results, port }) {
		await bridge.reset();

		const url = `http://127.0.0.1:${port || 8080}/test`;
		const colourSet = [
			"rgb(255, 255, 255)",
			"rgb(221, 229, 199)",
			"rgb(105, 27, 32)",
			"rgb(8, 20, 35)",
		];

		for (const expectedColour of colourSet) {
			await driver.get(
				`${url}?background=${encodeURIComponent(expectedColour)}`,
			);
			await sleep(500);

			const actualColour = await getFrameColour(driver);

			if (!actualColour) {
				results.fail(
					"Failed to get frame colour",
					"no --lwt-accent-color set",
				);
			} else if (compareColour(expectedColour, actualColour)) {
				results.pass("Applies correct frame colour");
			} else {
				results.fail(
					"Applies wrong frame colour",
					`expected: ${expectedColour}, got: ${actualColour}`,
				);
			}
		}
	},
};
