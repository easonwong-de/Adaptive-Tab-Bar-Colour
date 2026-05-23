import { sleep } from "selenium-webext-bridge";
import type { TestCase } from "../helpers/types.js";
import { compareColour, getFrameColour } from "../helpers/utils.js";

export const testCase: TestCase = {
	name: "Apply Browser Theme",
	async run({ driver, bridge, results }) {
		await bridge.reset();

		const baseUrl = "http://127.0.0.1:8080/test";
		const testColours = ["#ffffff", "#dde5c7", "#50171b", "#081423"];

		const verifyFrameColour = async (expected: string) => {
			await driver.get(
				`${baseUrl}?background=${expected.replace("#", "%23")}`,
			);
			await sleep(1000);
			const frame = await getFrameColour(driver);

			if (!frame) {
				results.fail(
					"Applies frame colour",
					"no --lwt-accent-color set",
				);
			} else if (compareColour(expected, frame)) {
				results.pass("Applies frame colour", frame);
			} else {
				results.fail(
					"Applies frame colour",
					`expected: ${expected}, got: ${frame}`,
				);
			}
		};

		for (const colour of testColours) {
			await verifyFrameColour(colour);
		}
	},
};
