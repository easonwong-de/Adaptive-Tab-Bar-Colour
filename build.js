#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync, spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes("--watch");
const log = (msg, color = 42) => console.log(`\x1b[${color}m ${msg} \x1b[0m`);

// 1. Update Version
const { version } = JSON.parse(
	readFileSync(join(__dirname, "package.json"), "utf8"),
);
log(`1. Updating add-on to version ${version}...`);

const manifestPath = join(__dirname, "src/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t") + "\n");

const constantsPath = join(__dirname, "src/constants.js");
const constants = readFileSync(constantsPath, "utf8");
if (constants.includes("export const addonVersion")) {
	writeFileSync(
		constantsPath,
		constants.replace(
			/export const addonVersion = \[[\d, ]+\];/,
			`export const addonVersion = [${version.split(".").map(Number).join(", ")}];`,
		),
	);
} else {
	log("Could not find addonVersion in constants.js", 41);
}

// 2. Format
log("2. Formatting source code...");
execSync('prettier "src/**" --write', { stdio: "inherit" });

// 3. Build / Watch
log(`3. ${isWatch ? "Starting" : "Building"} extension...`);
execSync("vite build", { stdio: "inherit" });

if (isWatch) {
	const vite = spawn("vite build --watch", {
		stdio: ["ignore", "inherit", "inherit"],
		shell: true,
	});
	const webExt = spawn("web-ext run -s=./build -f=deved --devtools", {
		stdio: "inherit",
		shell: true,
	});

	const exit = () => {
		vite.kill();
		webExt.kill();
		process.exit();
	};
	webExt.on("exit", exit);
	process.on("SIGINT", exit);
} else {
	execSync("web-ext lint -s=./build", { stdio: "inherit" });
	execSync("web-ext build -s=./build -a=dist -o", { stdio: "inherit" });
}
