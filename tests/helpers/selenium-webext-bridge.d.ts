declare module "selenium-webext-bridge" {
	import type { WebDriver } from "selenium-webdriver";
	import { Command } from "selenium-webdriver/lib/command";

	export { Command };

	export class TestResults {
		pass(name: string, details?: string): void;
		fail(name: string, details?: string): void;
		error(name: string, err: unknown): void;
		summary(): void;
		exitCode(): number;
	}

	export interface TestBridge {
		getExtensionUrl(id: string): Promise<string | null>;
		reset(): Promise<void>;
	}

	export type LaunchOptions = {
		extensions: string[];
		firefoxArgs?: string[];
	};

	export type LaunchedBrowser = { driver: WebDriver; testBridge: TestBridge };

	export function cleanupBrowser(
		browser: LaunchedBrowser | null,
	): Promise<void>;

	export function launchBrowser(
		options: LaunchOptions,
	): Promise<LaunchedBrowser>;

	export function sleep(ms: number): Promise<void>;
}
