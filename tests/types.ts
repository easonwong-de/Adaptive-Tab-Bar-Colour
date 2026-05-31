import type { WebDriver } from "selenium-webdriver";
import type { TestBridge, TestResults } from "selenium-webext-bridge";

export type TestContext = {
	driver: WebDriver;
	bridge: TestBridge;
	results: TestResults;
	optionsUrl: string;
	popupUrl: string;
	port: number;
};

export type TestCase = {
	name: string;
	run(context: TestContext): Promise<void>;
};

declare global {
	const browser: typeof import("wxt/browser").browser;
}
