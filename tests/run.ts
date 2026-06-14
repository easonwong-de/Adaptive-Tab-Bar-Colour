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

		firefoxOptions.setPreference("browser.dom.window.dump.enabled", true);
		firefoxOptions.setPreference("devtools.console.stdout.content", true);
		firefoxOptions.setPreference("devtools.console.stdout.chrome", true);
		firefoxOptions.setPreference("extensions.logging.enabled", true);

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
			console.log("  Waiting for extension initialization...");
			await sleep(3000); // Give CI environments more time to process the extension

			const handles = await driver.getAllWindowHandles();
			console.log(`  Windows after extension install: ${handles.length}`);

			if (handles.length === 0) {
				await driver.get("about:blank");
				await sleep(500);
			} else {
				await driver.switchTo().window(handles[0]);
			}

			// Initialize the bridge object that was declared earlier
			bridge = new TestBridge(driver);
			try {
				await bridge.init();
			} catch (e) {
				console.warn("  Bridge init warning:", e);
			}

			await driver.get("http://127.0.0.1:8080/test/background=black");
			try {
				let checkCount = 0;
				await driver.wait(async () => {
					const injected = await driver.executeScript(() => {
						return typeof window.TestBridge !== "undefined";
					});
					if (injected) return true;

					checkCount++;
					if (checkCount % 5 === 0) { // Every ~2.5 seconds, try refreshing
						console.log("  Bridge missing, triggering page refresh...");
						await driver.navigate().refresh();
					}
					return false;
				}, 5000);
				results.pass("Bridge is injected.");
			} catch {
				results.fail("Bridge", "Bridge injection timeout");
				
				// Dump diagnostic info for CI runner
				console.error("\n--- DEBUG INFO ---");
				console.error("Current URL:", await driver.getCurrentUrl());
				console.error("Ready state:", await driver.executeScript("return document.readyState"));
				console.error("Page source:\n", await driver.getPageSource());
				
				try {
					const capturedErrors = await driver.executeScript("return window.capturedErrors || [];");
					console.error("Page captured errors:\n", JSON.stringify(capturedErrors, null, 2));
				} catch (e) {}

				try {
					const browserLogs = await driver.manage().logs().get("browser");
					console.error("Browser logs:\n", JSON.stringify(browserLogs, null, 2));
				} catch (e) {}

				try {
					const geckodriverLogPath = path.join(process.cwd(), "geckodriver.log");
					if (fs.existsSync(geckodriverLogPath)) {
						const logs = fs.readFileSync(geckodriverLogPath, "utf-8");
						console.error("Geckodriver logs (last 50 lines):\n", logs.split("\n").slice(-50).join("\n"));
					}
				} catch (e) {}

				const screenshot = await driver.takeScreenshot();
				const screenshotPath = path.join(OUTPUT_DIR, "debug-injection-timeout.png");
				fs.writeFileSync(screenshotPath, screenshot, "base64");
				console.error(`Saved screenshot to: ${screenshotPath}\n`);
			}
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
		// await cleanupBrowser(browser);
		server.close();
	}

	results.summary();
	process.exit(results.exitCode());
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
