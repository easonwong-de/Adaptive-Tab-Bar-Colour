import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import react from "@vitejs/plugin-react";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const copyResources = {
	name: "copy-resources",
	buildStart() {
		this.addWatchFile(resolve(__dirname, "src/manifest.json"));
	},
	writeBundle() {
		if (!fs.existsSync("build")) fs.mkdirSync("build");
		fs.copyFileSync("src/manifest.json", "build/manifest.json");
		fs.cpSync("src/_locales", "build/_locales", { recursive: true });
		fs.cpSync("src/images", "build/images", { recursive: true });
	},
};

const minifyScripts = {
	name: "minify-scripts",
	buildStart() {
		this.addWatchFile(resolve(__dirname, "src/atbc.js"));
		this.addWatchFile(resolve(__dirname, "src/background.js"));
		this.addWatchFile(resolve(__dirname, "src/colour.js"));
		this.addWatchFile(resolve(__dirname, "src/constants.js"));
		this.addWatchFile(resolve(__dirname, "src/preference.js"));
		this.addWatchFile(resolve(__dirname, "src/utility.js"));
	},
	async writeBundle() {
		await Promise.all([
			build({
				entryPoints: ["src/background.js"],
				bundle: true,
				minify: true,
				outfile: "build/background.js",
				format: "esm",
			}),
			build({
				entryPoints: ["src/atbc.js"],
				bundle: true,
				minify: true,
				outfile: "build/atbc.js",
			}),
		]);
	},
};

const buildUi = [
	react(),
	{
		name: "build-ui",
		config() {
			return {
				root: "src/ui",
				build: {
					cssMinify: "lightningcss",
					outDir: resolve(__dirname, "build"),
					emptyOutDir: true,
					rollupOptions: {
						input: {
							popup: resolve(__dirname, "src/ui/popup.html"),
							options: resolve(__dirname, "src/ui/options.html"),
						},
						output: {
							entryFileNames: "[name].js",
						},
					},
				},
			};
		},
	},
];

export default defineConfig({
	plugins: [copyResources, minifyScripts, buildUi],
});
