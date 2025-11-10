#!/usr/bin/env node

/* This script synchronizes the version number across project files.
It reads the version from package.json and updates:
	1. src/manifest.json: version
	2. src/constants.js: addonVersion */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8")).version;

console.log(`Updating version to ${version}...`);

const manifestPath = join(__dirname, "src", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t") + "\n");

console.log("✓ Updated manifest.json");

const constantsPath = join(__dirname, "src", "constants.js");
let constantsContent = readFileSync(constantsPath, "utf8");
const addonVersionOld = /export const addonVersion = \[[\d, ]+\];/;
const addonVersionNew = `export const addonVersion = [${version.split(".").map(Number).join(", ")}];`;

if (addonVersionOld.test(constantsContent)) {
	writeFileSync(constantsPath, constantsContent.replace(addonVersionOld, addonVersionNew));
	console.log("✓ Updated constants.js");
} else {
	console.error("⚠ Could not find addonVersion in constants.js");
}

console.log("Version sync complete.");
