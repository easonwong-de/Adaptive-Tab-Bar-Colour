import type { WebDriver } from "selenium-webdriver";
import type { TestResults } from "selenium-webext-bridge";

export type Bridge = {
	getExtensionUrl(id: string): Promise<string | null>;
	reset(): Promise<void>;
};

export type TestContext = {
	driver: WebDriver;
	bridge: Bridge;
	results: TestResults;
	optionsUrl: string;
	popupUrl: string;
	extDir: string;
};

export type TestCase = {
	name: string;
	run(context: TestContext): Promise<void>;
};

type StorageGetKeys = string | string[] | Record<string, unknown> | null;

interface BrowserStorageArea {
	get<T = Record<string, unknown>>(keys?: StorageGetKeys): Promise<T>;
	set(items: Record<string, unknown>): Promise<void>;
}

declare global {
	const browser: {
		storage: { local: BrowserStorageArea };
		theme?: { update?: (windowId: number, theme: unknown) => void };
	};
}
