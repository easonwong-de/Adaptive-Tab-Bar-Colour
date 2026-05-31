declare module "selenium-webext-bridge" {
	import type { WebDriver } from "selenium-webdriver";

	export class TestResults {
		pass(testName: string): void;
		fail(testName: string, reason: string): void;
		error(testName: string, error: unknown): void;
		summary(): void;
		exitCode(): 0 | 1;
	}

	export interface TestWebDriver extends WebDriver {
		installAddon(path: string, temporary?: boolean): Promise<string>;
		uninstallAddon(id: string): Promise<void>;
	}

	export class TestBridge {
		constructor(driver: WebDriver);
		init(): Promise<void>;
		getExtensionUrl(id: string): Promise<string | null>;
		reset(): Promise<void>;
	}

	export type TestBrowser = { driver: TestWebDriver; testBridge: TestBridge };

	export function launchBrowser(options: {
		extensions?: string[];
		BridgeClass?: typeof TestBridge;
		headless?: boolean;
		waitForInit?: number;
		preferences?: Record<string, string | number | boolean>;
		firefoxArgs?: string[];
	}): Promise<TestBrowser>;

	export function cleanupBrowser(browser: TestBrowser | null): Promise<void>;

	export function sleep(ms: number): Promise<void>;
}
