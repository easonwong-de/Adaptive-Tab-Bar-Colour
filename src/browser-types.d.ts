import "@wxt-dev/browser";
import type { Theme } from "./utils/types.js";

declare module "@wxt-dev/browser" {
	namespace Browser {
		const theme: {
			update(windowId: number, theme: Theme): Promise<void>;
			reset(windowId?: number): Promise<void>;
		};
	}
}
