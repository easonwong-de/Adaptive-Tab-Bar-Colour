import "@wxt-dev/browser";
import type { Theme } from "./utils/types";

declare module "@wxt-dev/browser" {
	namespace Browser {
		namespace tabs {
			interface OnUpdatedFilter {
				urls?: string[];
				properties?: string[];
				tabId?: number;
				windowId?: number;
				cookieStoreId?: string | number;
			}
		}
		namespace events {
			interface Event<T extends (...args: any) => void> {
				addListener(
					callback: T,
					filter: Browser.tabs.OnUpdatedFilter,
				): void;
			}
		}
		const theme: {
			update(windowId: number, theme: Theme): Promise<void>;
			reset(windowId?: number): Promise<void>;
		};
		const browserSettings: {
			overrideContentColorScheme?: {
				get(details: {}): Promise<{ value: "dark" | "light" | "auto" }>;
				onChange?: {
					addListener(
						listener: (details: {
							value: "dark" | "light" | "auto";
							levelOfControl: string;
						}) => void,
					): void;
				};
			};
		};
	}
}
