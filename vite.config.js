import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

const copyStaticAssets = () => {
	return {
		name: "copy-static-assets",
		writeBundle() {
			if (!fs.existsSync("build")) fs.mkdirSync("build");
			fs.copyFileSync("src/manifest.json", `build/manifest.json`);
			fs.cpSync("src/_locales", `build/_locales`, { recursive: true });
			fs.cpSync("src/images", `build/images`, { recursive: true });
		},
	};
};

export default defineConfig({
	plugins: [react(), copyStaticAssets()],
	build: {
		outDir: "build",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				popup: resolve(__dirname, "src/popup/index.html"),
				option: resolve(__dirname, "src/options/index.html"),
				background: resolve(__dirname, "src/background.js"),
				atbc: resolve(__dirname, "src/atbc.js"),
			},
			output: {
				entryFileNames: "[name].js",
			},
		},
	},
});
