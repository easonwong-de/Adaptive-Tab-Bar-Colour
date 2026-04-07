import { defineConfig } from "wxt";

export default defineConfig({
	browser: "firefox",
	manifest: {
		action: { default_title: "__MSG_extensionName__" },
		browser_specific_settings: {
			gecko: {
				id: "ATBC@EasonWong",
				strict_min_version: "57.0",
				// @ts-ignore
				data_collection_permissions: { required: ["none"] },
			},
		},
		default_locale: "en",
		description: "__MSG_extensionDescription__",
		developer: {
			name: "Eason & Yue",
			url: "https://easonwong.de/",
		},
		homepage_url:
			"https://github.com/easonwong-de/adaptive-tab-bar-colour/",
		icons: {
			16: "/icon/icon-16.png",
			32: "/icon/icon-32.png",
			48: "/icon/icon-48.png",
			96: "/icon/icon-96.png",
			128: "/icon/icon-128.png",
		},
		name: "__MSG_extensionName__",
		options_ui: { open_in_tab: false },
		permissions: [
			"tabs",
			"theme",
			"storage",
			"browserSettings",
			"management",
		],
	},
	manifestVersion: 3,
	modules: ["@wxt-dev/module-react", "@wxt-dev/i18n/module"],
	srcDir: "src",
	vite: () => ({
		css: {
			modules: {
				generateScopedName: "[hash:base64:6]",
				localsConvention: "camelCase",
			},
		},
	}),
	webExt: {
		binaries: { firefox: "firefoxdeveloperedition" },
		openDevtools: true,
	},
});
