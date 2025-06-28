#!/usr/bin/env node

/* This script synchronizes the version number across project files.
It reads the version from package.json and updates:
	1. src/manifest.json: Sets its "version" field to match package.json.
	2. src/default_values.js: Updates the exported addonVersion array to reflect the current version. */

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

const defaultValuesPath = join(__dirname, "src", "default_values.js");
let defaultValuesContent = readFileSync(defaultValuesPath, "utf8");
const addonVersionOld = /export const addonVersion = \[[\d, ]+\];/;
const addonVersionNew = `export const addonVersion = [${version.split(".").map(Number).join(", ")}];`;

if (addonVersionOld.test(defaultValuesContent)) {
	writeFileSync(defaultValuesPath, defaultValuesContent.replace(addonVersionOld, addonVersionNew));
	console.log("✓ Updated default_values.js");
} else {
	console.error("⚠ Could not find addonVersion in default_values.js");
}

console.log("Version sync complete.");
