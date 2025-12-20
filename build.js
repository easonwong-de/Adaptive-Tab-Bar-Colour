#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("\x1b[42m 1. Running Prettier... \x1b[0m");
execSync("npm run prettier", { stdio: "inherit" });

const version = JSON.parse(
	readFileSync(join(__dirname, "package.json"), "utf8"),
).version;

console.log(
	`\x1b[42m 2. Updating manifest.json to version ${version}... \x1b[0m`,
);
const manifestPath = join(__dirname, "src", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t") + "\n");

console.log(
	`\x1b[42m 3. Updating constants.js to version ${version}... \x1b[0m`,
);
const constantsPath = join(__dirname, "src", "constants.js");
let constantsContent = readFileSync(constantsPath, "utf8");
const addonVersionOld = /export const addonVersion = \[[\d, ]+\];/;
const addonVersionNew = `export const addonVersion = [${version.split(".").map(Number).join(", ")}];`;
if (addonVersionOld.test(constantsContent)) {
	writeFileSync(
		constantsPath,
		constantsContent.replace(addonVersionOld, addonVersionNew),
	);
} else {
	console.error(
		"\x1b[41m Could not find addonVersion in constants.js \x1b[0m",
	);
}

console.log("\x1b[42m 4. Building extension... \x1b[0m");
execSync("web-ext build -s=./src -a=dist -o", { stdio: "inherit" });
