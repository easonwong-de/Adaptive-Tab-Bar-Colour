#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { TestResults } from "selenium-webext-bridge";
import { cleanupBrowser, launchBrowser } from "selenium-webext-bridge";
import type { TestBrowser } from "selenium-webext-bridge";
import type { TestContext } from "./helpers/types.js";
import { createServer, getTestCases, getWebExtDir } from "./helpers/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", ".output");
const SPEC_DIR = path.join(__dirname, "specs");
const SERVER_PORT = 8080;

async function main() {
	const results = new TestResults();
	const server = await createServer(SERVER_PORT);
	let browser: TestBrowser | null = null;

	try {
		const webExtDir = await getWebExtDir(OUTPUT_DIR);
		browser = await launchBrowser({
			waitForInit: 0,
			headless: false,
			firefoxArgs: ["-remote-allow-system-access"],
		});
		const { driver, testBridge: bridge } = browser;

		const testCases = await getTestCases(SPEC_DIR);
		for (const testCase of testCases) {
			console.log(`\n🔍 \x1b[1;34mTest case: ${testCase.name}\x1b[0m\n`);
			let webExtId: string | null = null;
			try {
				webExtId = await driver.installAddon(webExtDir, true);
				await driver.sleep(1000);
				const url = await bridge.getExtensionUrl(webExtId);
				if (!url || !url.startsWith("moz-extension://"))
					throw new Error("Could not get extension URL");
				const optionsUrl = `${url}/options.html`;
				const popupUrl = `${url}/popup.html`;
				const context: TestContext = {
					driver,
					bridge,
					results,
					optionsUrl,
					popupUrl,
					port: SERVER_PORT,
				};
				await testCase.run(context);
			} catch (error) {
				results.error(testCase.name, error);
			} finally {
				await bridge.reset();
				if (webExtId) await driver.uninstallAddon(webExtId);
			}
		}
	} catch (error) {
		results.error("Test Suite", error);
	} finally {
		console.log();
		await cleanupBrowser(browser);
		server.close();
	}

	results.summary();
	process.exit(results.exitCode());
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
