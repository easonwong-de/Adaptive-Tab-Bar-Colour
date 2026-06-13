#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { TestResults, cleanupBrowser } from "selenium-webext-bridge";
import type { TestBrowser, TestWebDriver } from "selenium-webext-bridge";
import type { TestContext } from "./types.js";
import { createServer, getTestCases, getWebExtPath } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", ".output");
const SPEC_DIR = path.join(__dirname, "specs");
const SERVER_PORT = 8080;

async function main() {
	const headless = process.argv.includes("--headless");
	const results = new TestResults();
	const server = await createServer(SERVER_PORT);
	let browser: TestBrowser | null = null;

	try {
		const webExtPath = await getWebExtPath(OUTPUT_DIR, !headless);
		const testCases = await getTestCases(SPEC_DIR);
		console.log(`\nUsing extension at ${webExtPath}\n`);

		const { Builder } = await import("selenium-webdriver");
		const firefox = await import("selenium-webdriver/firefox");
		const os = await import("node:os");
		const fs = await import("node:fs");
		const { TestBridge, extensionDir, sleep } =
			await import("selenium-webext-bridge");

		const firefoxOptions = new firefox.Options();
		const profilePath = path.join(
			os.tmpdir(),
			`firefox-test-profile-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		);
		fs.mkdirSync(profilePath, { recursive: true });

		firefoxOptions.setProfile(profilePath);
		firefoxOptions.setPreference("browser.tabs.warnOnClose", false);
		firefoxOptions.setPreference("browser.warnOnQuit", false);
		firefoxOptions.setPreference(
			"browser.tabs.closeWindowWithLastTab",
			false,
		);
		firefoxOptions.setPreference("services.sync.engine.tabs", false);
		firefoxOptions.setPreference("services.sync.engine.prefs", false);
		firefoxOptions.addArguments("--new-instance");
		firefoxOptions.addArguments("-no-remote");
		firefoxOptions.setPreference("toolkit.startup.max_resumed_crashes", -1);
		firefoxOptions.addArguments("-remote-allow-system-access");

		if (headless) {
			firefoxOptions.addArguments("-headless");
		}

		let driver;
		let bridge;

		try {
			console.log("  Building Firefox driver...");
			driver = (await new Builder()
				.forBrowser("firefox")
				.setFirefoxOptions(firefoxOptions)
				.build()) as TestWebDriver;

			console.log("  Driver built successfully");
			await driver.get("about:blank");
			await sleep(500);

			console.log("  Installing Test Bridge extension...");
			await driver.installAddon(extensionDir, true);
			await sleep(500);

			const handles = await driver.getAllWindowHandles();
			console.log(`  Windows after extension install: ${handles.length}`);

			if (handles.length === 0) {
				await driver.get("about:blank");
				await sleep(500);
			} else {
				await driver.switchTo().window(handles[0]);
			}

			console.log("Opening addon page...");
			await driver.get("about:debugging#/runtime/this-firefox");
			await sleep(1000);
			console.log(
				await (
					await driver.findElement({ className: "page" })
				).getText(),
			);
			/* const screenshot = await driver.takeScreenshot();
			fs.writeFileSync("screenshot.png", screenshot, "base64"); */

			console.log("  Initializing TestBridge...");
			bridge = new TestBridge(driver);
			await bridge.init();

			browser = {
				driver,
				testBridge: bridge,
				profilePath,
			} as unknown as TestBrowser;
		} catch (error) {
			if (fs.existsSync(profilePath)) {
				fs.rmSync(profilePath, { recursive: true, force: true });
			}
			throw error;
		}

		for (const testCase of testCases) {
			break;
			console.log(`\n🔍 \x1b[1;34mTest case: ${testCase.name}\x1b[0m\n`);
			let webExtId: string | null = null;
			try {
				webExtId = await driver.installAddon(webExtPath, true);
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
