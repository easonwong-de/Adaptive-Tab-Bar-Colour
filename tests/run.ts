#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	TestResults,
	cleanupBrowser,
	launchBrowser,
} from "selenium-webext-bridge";
import type { LaunchedBrowser } from "selenium-webext-bridge";
import type { TestContext } from "./helpers/types.js";
import {
	createColorServer,
	discoverTestCases,
	getExtensionBaseUrl,
	resolveExtensionDir,
} from "./helpers/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = process.env.EXT_OUTPUT_DIR
	? path.resolve(process.env.EXT_OUTPUT_DIR)
	: path.join(__dirname, "..", ".output");
const EXT_ID = process.env.EXT_ID || "ATBC@EasonWong";

async function main() {
	const results = new TestResults();
	const server = await createColorServer();
	let browser: LaunchedBrowser | null = null;

	try {
		const extDir = await resolveExtensionDir(OUTPUT_DIR);
		browser = await launchBrowser({
			extensions: [extDir],
			firefoxArgs: ["-remote-allow-system-access"],
		});
		const { driver, testBridge: bridge } = browser;
		const extBaseUrl = await getExtensionBaseUrl(bridge, EXT_ID);
		if (!extBaseUrl) throw new Error("Could not get extension URL");

		const optionsUrl = `${extBaseUrl}/options/options.html`;
		const popupUrl = `${extBaseUrl}/popup/popup.html`;
		const context: TestContext = {
			driver,
			bridge,
			results,
			optionsUrl,
			popupUrl,
			extDir,
		};
		const testCases = await discoverTestCases(
			path.join(__dirname, "specs"),
		);
		for (const testCase of testCases) {
			console.log(`\n🔍 \x1b[1;34mTest case: ${testCase.name}\x1b[0m\n`);
			try {
				await testCase.run(context);
			} catch (e) {
				results.error(testCase.name, e);
			}
		}
	} catch (e) {
		results.error("Test Suite", e);
	} finally {
		await cleanupBrowser(browser);
		server.close();
	}

	console.log("");
	results.summary();
	process.exit(results.exitCode());
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
