import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import react from "@vitejs/plugin-react";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const copyResources = {
	name: "copy-resources",
	writeBundle() {
		if (!fs.existsSync("build")) fs.mkdirSync("build");
		fs.copyFileSync("src/manifest.json", "build/manifest.json");
		fs.cpSync("src/_locales", "build/_locales", { recursive: true });
		fs.cpSync("src/images", "build/images", { recursive: true });
	},
};

const minifyScripts = {
	name: "minify-scripts",
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
