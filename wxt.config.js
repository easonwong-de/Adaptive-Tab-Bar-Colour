import { defineConfig } from "wxt";

export default defineConfig({
	srcDir: "src",
	browser: "firefox",
	manifestVersion: 3,
	webExt: {
		binaries: {
			firefox: "firefoxdeveloperedition",
		},
		openDevtools: true,
	},
	modules: ["@wxt-dev/module-react", "@wxt-dev/i18n/module"],
	vite: () => ({
		css: {
			modules: {
				localsConvention: "camelCase",
				generateScopedName: "[hash:base64:6]",
			},
		},
	}),
	manifest: {
		author: "Eason Wong",
		browser_specific_settings: {
			gecko: {
				id: "ATBC@EasonWong",
				strict_min_version: "121.0",
				data_collection_permissions: { required: ["none"] },
			},
		},
		default_locale: "en",
		description: "__MSG_extensionDescription__",
		homepage_url: "https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour",
		name: "__MSG_extensionName__",
		icons: {
			16: "/icon/icon-16.png",
			24: "/icon/icon-24.png",
			48: "/icon/icon-48.png",
			96: "/icon/icon-96.png",
			128: "/icon/icon-128.png",
		},
		permissions: [
			"tabs",
			"theme",
			"storage",
			"browserSettings",
			"management",
		],
		action: {
			default_title: "__MSG_extensionName__",
		},
		options_ui: {
			open_in_tab: false,
		},
	},
});
