import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import readline from "node:readline";
import type { WebDriver } from "selenium-webdriver";
import { Command } from "selenium-webext-bridge";
import type { Bridge, TestCase } from "./types.js";

/** Resolves the extension output directory to use for tests. */
export async function resolveExtensionDir(
	outputDirectory: string,
): Promise<string> {
	const entries = await fs.readdir(outputDirectory, { withFileTypes: true });
	const options = entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));

	if (options.length === 0) {
		throw new Error(`No extension builds found in ${outputDirectory}`);
	}

	const requested = process.env.EXT_OUTPUT_NAME;
	if (requested) {
		if (!options.includes(requested)) {
			throw new Error(
				`EXT_OUTPUT_NAME not found in ${outputDirectory}: ${requested}`,
			);
		}
		return path.join(outputDirectory, requested);
	}

	const selected = process.stdin.isTTY
		? await promptForSelection(options)
		: options[0];
	return path.join(outputDirectory, selected);
}

/** Prompts the user to select an option from a list. */
export function promptForSelection(options: string[]): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let index = 0;
		const input = process.stdin;
		const output = process.stdout;
		const colour = { blue: "\u001b[34m", reset: "\u001b[0m" };

		const render = () => {
			readline.cursorTo(output, 0, 0);
			readline.clearScreenDown(output);
			output.write("Select extension build under .output:\n\n");
			options.forEach((option, position) => {
				const prefix =
					position === index
						? `${colour.blue}> ${option}${colour.reset}`
						: `  ${option}`;
				output.write(`${prefix}\n`);
			});
			output.write("\nUse Up/Down, Enter to select.\n");
		};

		const cleanup = () => {
			input.setRawMode(false);
			input.pause();
			input.off("data", onData);
			readline.cursorTo(output, 0, 0);
			readline.clearScreenDown(output);
		};

		const onData = (data: Buffer) => {
			const key = data.toString();
			switch (key) {
				case "\u0003": {
					cleanup();
					reject(new Error("Selection cancelled"));
					return;
				}
				case "\r": {
					const selection = options[index];
					cleanup();
					resolve(selection);
					return;
				}
				case "\u001b[A": {
					index = (index - 1 + options.length) % options.length;
					render();
					return;
				}
				case "\u001b[B": {
					index = (index + 1) % options.length;
					render();
					return;
				}
				default: {
					return;
				}
			}
		};

		input.setRawMode(true);
		input.resume();
		input.on("data", onData);
		render();
	});
}

/** Discovers test cases from spec files in a directory. */
export async function discoverTestCases(
	specificationsDirectory: string,
): Promise<TestCase[]> {
	const entries = await fs.readdir(specificationsDirectory, {
		withFileTypes: true,
	});
	const specificationFiles = entries
		.filter(
			(entry) =>
				entry.isFile() &&
				entry.name.endsWith(".spec.ts") &&
				!entry.name.startsWith("."),
		)
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));

	const cases: TestCase[] = [];
	for (const fileName of specificationFiles) {
		const specificationPath = path.join(specificationsDirectory, fileName);
		const module = await import(specificationPath);
		if (!module.testCase) {
			throw new Error(`Missing testCase export in ${fileName}`);
		}
		cases.push(module.testCase as TestCase);
	}

	return cases;
}

/** Gets the extension base URL for a web extension. */
export async function getExtensionBaseUrl(
	bridge: Bridge,
	webExtensionId: string,
): Promise<string | undefined> {
	try {
		const extensionBaseUrl = await bridge.getExtensionUrl(webExtensionId);
		if (
			extensionBaseUrl &&
			extensionBaseUrl.startsWith("moz-extension://")
		) {
			return extensionBaseUrl;
		}
	} catch {}
}

/**
 * Serves pages with specific background colours. Example:
 * /test-page?bg=%23ff0000
 */
export function createColorServer(port = 8080): Promise<http.Server> {
	return new Promise<http.Server>((resolve, reject) => {
		const server = http.createServer((req, res) => {
			const requestAddress = new URL(
				req.url || "/",
				`http://127.0.0.1:${port}`,
			);
			const backgroundColour =
				requestAddress.searchParams.get("bg") || "#f0f0f0";
			const pageName = requestAddress.pathname.slice(1) || "test";

			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`<!DOCTYPE html>
				<html>
				<head><meta charset="UTF-8"><title>${pageName}</title></head>
				<body style="margin:0; padding:0; background:${backgroundColour}; min-height:100vh;">
					<div id="keepalive"></div>
					<script>
						setInterval(() => {
							document.getElementById('keepalive').textContent = Date.now();
						}, 5000);
					</script>
				</body>
				</html>`);
		});

		server.on("error", reject);
		server.listen(port, "127.0.0.1", () => {
			console.log(`Colour test server on http://127.0.0.1:${port}`);
			resolve(server);
		});
	});
}

/** Reads the browser frame's accent colour from Firefox chrome context. */
export async function getFrameColor(driver: WebDriver): Promise<string | null> {
	await driver.execute(
		new Command("setContext").setParameter("context", "chrome"),
	);
	try {
		return await driver.executeScript(() => {
			const style = getComputedStyle(document.documentElement);
			return style.getPropertyValue("--lwt-accent-color").trim() || null;
		});
	} finally {
		await driver.execute(
			new Command("setContext").setParameter("context", "content"),
		);
	}
}

/** Parses an rgba/rgb colour string. */
export function parseRGB(
	colourText: string | null,
): { r: number; g: number; b: number } | null {
	if (!colourText) {
		return null;
	}
	const match = colourText.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
	return match ? { r: +match[1], g: +match[2], b: +match[3] } : null;
}

/** Checks if two colour strings are different with tolerance value. */
export function colorsDiffer(
	firstColour: string | null,
	secondColour: string | null,
	tolerance = 5,
): boolean {
	const firstParsed = parseRGB(firstColour);
	const secondParsed = parseRGB(secondColour);
	if (!firstParsed || !secondParsed) {
		return true;
	}
	return (
		Math.abs(firstParsed.r - secondParsed.r) > tolerance ||
		Math.abs(firstParsed.g - secondParsed.g) > tolerance ||
		Math.abs(firstParsed.b - secondParsed.b) > tolerance
	);
}
