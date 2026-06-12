import { defineAppConfig } from "#imports";
import pkg from "../package.json";

declare module "wxt/utils/define-app-config" {
	export interface WxtAppConfig {
		version: number[];
	}
}

export default defineAppConfig({
	version: pkg.version?.split(".")?.map(Number) ?? [0, 0],
});
