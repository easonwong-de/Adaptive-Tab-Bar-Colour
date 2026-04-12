import { supportsThemeAPI } from "./utility.js";
import { addonVersion, defaultPref } from "./constants.js";
import type {
	PreferenceContent,
	Rule,
	RuleList,
	RuleQueryResult,
} from "./types.js";

export default class preference {
	/** The content of the preference. */
	#content: PreferenceContent = { ...defaultPref };

	/** The listener for preference changes. */
	#listener: () => void = () => {};

	/** State for debouncing storage writes. */
	#state: {
		lastWrite: number;
		writeTimeout?: ReturnType<typeof setTimeout>;
	} = {
		lastWrite: 0,
	};

	/**
	 * Initialises preferences from storage.
	 *
	 * @async
	 */
	async initialise(): Promise<void> {
		const { result, removedKeys } = this.#normalise(
			await browser.storage.local.get(),
		);
		for (const key in result) this.#set(key, result[key]);
		removedKeys.forEach(
			async (key) => await browser.storage.local.remove(key),
		);
		if (!supportsThemeAPI()) this.#set("compatibilityMode", true);
		await this.#save();
		browser.storage.onChanged.addListener((changes, area) => {
			if (area !== "local") return;
			const newLastSave = changes.lastSave?.newValue;
			if (
				typeof newLastSave === "number" &&
				newLastSave > this.#content.lastSave
			) {
				for (const key in changes) {
					if (key in this.#content) {
						const prefKey = key as keyof PreferenceContent;
						this.#content[prefKey] = changes[prefKey]!
							.newValue as PreferenceContent[typeof prefKey];
					}
				}
				this.syncUI();
			}
		});
	}

	/**
	 * Resets preferences to default values.
	 *
	 * @param {string[]} [keys] - The preference keys to reset. If undefined,
	 *   resets all.
	 */
	async reset(keys?: string[]): Promise<void> {
		if (keys) {
			for (const key of keys)
				if (key in defaultPref) this.#set(key, defaultPref[key]);
		} else this.#content = { ...defaultPref };
		await this.#save();
	}

	/**
	 * Saves preferences to storage.
	 *
	 * @private
	 */
	async #save(): Promise<void> {
		this.#content.lastSave = Date.now();
		this.syncUI();
		if (this.#state.writeTimeout !== undefined)
			clearTimeout(this.#state.writeTimeout);
		this.#state.writeTimeout = setTimeout(
			async () => {
				this.#state.lastWrite = Date.now();
				await browser.storage.local.set(this.#content);
			},
			Math.max(0, 50 + this.#state.lastWrite - Date.now()),
		);
	}

	/**
	 * Sets a preference value.
	 *
	 * @private
	 * @param {string} key - The preference key.
	 * @param {any} value - The value.
	 */
	#set(key: string, value: any): void {
		if (typeof value !== typeof defaultPref[key]) value = defaultPref[key];
		switch (key) {
			case "tabbar":
			case "tabbarBorder":
			case "tabSelected":
			case "tabSelectedBorder":
			case "toolbar":
			case "toolbarBorder":
			case "toolbarField":
			case "toolbarFieldBorder":
			case "toolbarFieldOnFocus":
			case "sidebar":
			case "sidebarBorder":
			case "popup":
			case "popupBorder":
				value = this.#normaliseNumericPref(value, {
					min: -50,
					max: 50,
					step: 1,
				});
				break;
			case "minContrast_light":
			case "minContrast_dark":
				value = this.#normaliseNumericPref(value, {
					min: 0,
					max: 210,
					step: 5,
				});
				break;
			case "ruleList":
				for (const id in value)
					if (!this.#validateRule(value[id])) value[id] = null;
				break;
			default:
				break;
		}
		this.#content[key] = value;
	}

	/**
	 * Validates a rule object structure.
	 *
	 * @param {Rule} rule - The rule to validate.
	 * @returns {boolean} `true` if the rule is valid.
	 */
	#validateRule(rule: Rule): boolean {
		return (
			rule === null ||
			(typeof rule === "object" &&
				typeof rule?.header === "string" &&
				((rule.headerType === "URL" &&
					((rule.type === "THEME_COLOUR" &&
						typeof rule.value === "boolean") ||
						(rule.type === "QUERY_SELECTOR" &&
							typeof rule.value === "string"))) ||
					((rule.headerType === "URL" ||
						rule.headerType === "ADDON_ID") &&
						rule.type === "COLOUR" &&
						typeof rule.value === "string")))
		);
	}

	/**
	 * Normalises a numeric preference within constraints.
	 *
	 * Applies min/max bounds, and rounds to the nearest step.
	 *
	 * @private
	 * @param {number} num - The number to validate.
	 * @param {{ min: number; max: number; step: number }} range - Numeric
	 *   constraints.
	 * @param {number} range.min - The minimum allowed value.
	 * @param {number} range.max - The maximum allowed value.
	 * @param {number} range.step - The step size for rounding.
	 * @returns {number} The validated and adjusted number.
	 */
	#normaliseNumericPref(
		num: number,
		{ min, max, step }: { min: number; max: number; step: number },
	): number {
		if (-1 < num && num < 1) num = Math.round(num * 100);
		num = Math.max(min, Math.min(max, num));
		const remainder = (num - min) % step;
		if (remainder !== 0)
			num =
				remainder >= step / 2
					? num + (step - remainder)
					: num - remainder;
		return Math.round(num);
	}

	/**
	 * Normalises and migrates preferences from older versions.
	 *
	 * @private
	 * @param {Record<string, unknown>} content - The stored preference content.
	 * @returns {{ result: PreferenceContent; removedKeys: string[] }} The
	 *   normalised preferences and removed keys.
	 */
	#normalise(content: Record<string, unknown>): {
		result: PreferenceContent;
		removedKeys: string[];
	} {
		const storedVersion = Array.isArray(content.version)
			? (content.version as number[])
			: [];
		const migrateFrom = (version: number[]): boolean => {
			const maxLength = Math.max(storedVersion.length, version.length);
			for (let i = 0; i < maxLength; i++) {
				const current = storedVersion[i] ?? 0;
				const target = version[i] ?? 0;
				if (current !== target) return current < target;
			}
			return false;
		};
		if (!content.version || migrateFrom([2, 2, 1])) {
			return {
				result: { ...defaultPref },
				removedKeys: [],
			};
		}
		const result: Record<string, unknown> = {
			...defaultPref,
			...content,
		};
		if (migrateFrom([2, 4])) {
			browser.theme?.reset?.();
			if (result.minContrast_light === 165) result.minContrast_light = 90;
		}
		if (migrateFrom([3, 4]) && result.siteList) {
			result.ruleList = result.siteList as RuleList;
		}
		const removedKeys: string[] = [];
		for (const key in result) {
			if (!(key in defaultPref)) {
				delete result[key];
				removedKeys.push(key);
			}
		}
		result.version = addonVersion;
		return { result: result as PreferenceContent, removedKeys };
	}

	/**
	 * Returns preferences as JSON.
	 *
	 * @returns {string} The JSON string.
	 */
	exportJSON(): string {
		return JSON.stringify(this.#content);
	}

	/**
	 * Imports preferences from JSON.
	 *
	 * @param {string} jsonString - The JSON string.
	 * @returns {Promise<boolean>} `true` if successful.
	 */
	async importPref(jsonString: string): Promise<boolean> {
		try {
			const parsedPref = this.#normalise(JSON.parse(jsonString)).result;
			for (const key in parsedPref) this.#set(key, parsedPref[key]);
			await this.#save();
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Registers the listener for preference changes.
	 *
	 * @param {() => void} listener - The callback function.
	 * @returns {() => void} A function to remove the listener.
	 */
	setOnChangeListener(listener: () => void): () => void {
		this.#listener = listener;
		return () => (this.#listener = () => {});
	}

	/** Synchronises the UI with the current preference state. */
	syncUI() {
		this.#listener();
	}

	/**
	 * Gets the timestamp of the last update.
	 *
	 * @returns {number} Timestamp in ms.
	 */
	getLastSave(): number {
		return this.#content.lastSave;
	}

	/**
	 * Adds a rule to the rule list.
	 *
	 * @param {Rule} rule - The rule object.
	 */
	async addRule(rule: Rule) {
		let id = 1;
		while (id in this.#content.ruleList) id++;
		await this.setRule(id, rule);
	}

	/**
	 * Sets a rule by ID.
	 *
	 * @param {number} id - The rule ID.
	 * @param {Rule} rule - The rule object.
	 */
	async setRule(id: number, rule: Rule) {
		if (!this.#validateRule(rule)) return;
		this.#content.ruleList[id] = rule;
		await this.#save();
	}

	/**
	 * Finds the last matching rule for a URL or add-on ID.
	 *
	 * For URL header types, supports:
	 *
	 * - Full URL with or without trailing slash
	 * - Regular expressions
	 * - Wildcard patterns:
	 *
	 *   - `**` matches any string of any length
	 *   - `*` matches any characters except `/`, `.`, and `:`
	 *   - `?` matches any single character
	 *   - Scheme (e.g., `https://`) is optional
	 * - Hostname & path matching
	 *
	 * For add-on ID header types, performs exact string matching.
	 *
	 * @param {string | undefined} query - Site URL or add-on ID.
	 * @returns {RuleQueryResult} Result.
	 */
	getRule(query?: string): RuleQueryResult {
		let id = 0;
		let rule: Rule = null;
		if (!query) return { id: id, query: "", rule: rule };
		for (const currentId in this.#content.ruleList) {
			const currentRule = this.#content.ruleList[currentId];
			if (!currentRule || typeof currentRule.header !== "string")
				continue;
			const cleanQuery = query.replace(/\/$/, "");
			const cleanHeader = currentRule.header.replace(/\/$/, "");
			const isMatch =
				(currentRule.headerType === "ADDON_ID" &&
					currentRule.header === query) ||
				(currentRule.headerType === "URL" &&
					(cleanQuery === cleanHeader ||
						this.#testRegex(cleanQuery, cleanHeader) ||
						this.#testWildcard(cleanQuery, cleanHeader) ||
						this.#testHostname(cleanQuery, cleanHeader)));
			if (isMatch) {
				id = +currentId;
				rule = currentRule;
			}
		}
		return { id: id, query, rule: rule };
	}

	/**
	 * Tests whether a URL matches a regex pattern.
	 *
	 * @param {string} url - URL to test.
	 * @param {string} test - Regex pattern.
	 * @returns {boolean} Whether it matches.
	 */
	#testRegex(url: string, test: string): boolean {
		try {
			return new RegExp(`^${test}$`, "i").test(url);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Tests whether a URL matches a wildcard pattern.
	 *
	 * @param {string} url - URL to test.
	 * @param {string} test - Wildcard pattern.
	 * @returns {boolean} Whether it matches.
	 */
	#testWildcard(url: string, test: string): boolean {
		if (test.includes("*") || test.includes("?")) {
			try {
				const wildcardPattern = test
					.replace(/[.+^${}()|[\]\\]/g, "\\$&")
					.replace(/\*\*/g, "::WILDCARD_MATCH_ALL::")
					.replace(/\*/g, "[^/.:]*")
					.replace(/\?/g, ".")
					.replace(/::WILDCARD_MATCH_ALL::/g, ".*")
					.replace(/^([a-z]+:\/\/)/i, "$1")
					.replace(/^((?![a-z]+:\/\/).)/i, "(?:[a-z]+:\\/\\/)?$1");
				return new RegExp(`^${wildcardPattern}/?$`, "i").test(url);
			} catch (error) {
				return false;
			}
		} else {
			return false;
		}
	}

	/**
	 * Tests if a URL matches a specific hostname (with optional subdomains) or
	 * hostname with path.
	 *
	 * @private
	 * @param {string} url - The URL to test.
	 * @param {string} test - The hostname to match.
	 * @returns {boolean} `true` if the URL's hostname (with optional
	 *   subdomains) and path match, `false` otherwise.
	 */
	#testHostname(url: string, test: string): boolean {
		try {
			const { hostname, pathname } = new URL(url);
			const hostPart = test.split("/")[0];
			if (hostname !== hostPart && !hostname.endsWith(`.${hostPart}`))
				return false;
			const urlPath = hostPart + pathname;
			return urlPath === test || urlPath.startsWith(`${test}/`);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Gets whether dark/light scheme switching is allowed.
	 *
	 * @returns {boolean} `true` if scheme switching is allowed.
	 */
	get allowDarkLight(): boolean {
		return this.#content.allowDarkLight;
	}

	/**
	 * Sets whether dark/light scheme switching is allowed.
	 *
	 * @param {boolean} value - Whether to allow scheme switching.
	 */
	set allowDarkLight(value: boolean) {
		this.#set("allowDarkLight", value);
		this.#save();
	}

	/**
	 * Gets whether dynamic colour extraction is enabled.
	 *
	 * @returns {boolean} `true` if dynamic colour extraction is enabled.
	 */
	get dynamic(): boolean {
		return this.#content.dynamic;
	}

	/**
	 * Sets whether dynamic colour extraction is enabled.
	 *
	 * @param {boolean} value - Whether to enable dynamic colour extraction.
	 */
	set dynamic(value: boolean) {
		this.#set("dynamic", value);
		this.#save();
	}

	/**
	 * Gets whether theme colour should be ignored by default.
	 *
	 * @returns {boolean} `true` if theme colours are ignored by default.
	 */
	get noThemeColour(): boolean {
		return this.#content.noThemeColour;
	}

	/**
	 * Sets whether theme colour should be ignored by default.
	 *
	 * @param {boolean} value - Whether to ignore theme colours by default.
	 */
	set noThemeColour(value: boolean) {
		this.#set("noThemeColour", value);
		this.#save();
	}

	/**
	 * Gets whether compatibility mode is enabled.
	 *
	 * @returns {boolean} `true` if compatibility mode is enabled.
	 */
	get compatibilityMode(): boolean {
		return this.#content.compatibilityMode;
	}

	/**
	 * Sets whether compatibility mode is enabled.
	 *
	 * @param {boolean} value - Whether to enable compatibility mode.
	 */
	set compatibilityMode(value: boolean) {
		this.#set("compatibilityMode", value);
		this.#save();
	}

	/**
	 * Gets the tab bar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabbar(): number {
		return this.#content.tabbar;
	}

	/**
	 * Sets the tab bar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabbar(value: number) {
		this.#set("tabbar", value);
		this.#save();
	}

	/**
	 * Gets the tab bar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabbarBorder(): number {
		return this.#content.tabbarBorder;
	}

	/**
	 * Sets the tab bar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabbarBorder(value: number) {
		this.#set("tabbarBorder", value);
		this.#save();
	}

	/**
	 * Gets the selected tab brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabSelected(): number {
		return this.#content.tabSelected;
	}

	/**
	 * Sets the selected tab brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabSelected(value: number) {
		this.#set("tabSelected", value);
		this.#save();
	}

	/**
	 * Gets the selected tab border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabSelectedBorder(): number {
		return this.#content.tabSelectedBorder;
	}

	/**
	 * Sets the selected tab border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabSelectedBorder(value: number) {
		this.#set("tabSelectedBorder", value);
		this.#save();
	}

	/**
	 * Gets the toolbar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbar(): number {
		return this.#content.toolbar;
	}

	/**
	 * Sets the toolbar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbar(value: number) {
		this.#set("toolbar", value);
		this.#save();
	}

	/**
	 * Gets the toolbar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarBorder(): number {
		return this.#content.toolbarBorder;
	}

	/**
	 * Sets the toolbar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarBorder(value: number) {
		this.#set("toolbarBorder", value);
		this.#save();
	}

	/**
	 * Gets the toolbar field brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarField(): number {
		return this.#content.toolbarField;
	}

	/**
	 * Sets the toolbar field brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarField(value: number) {
		this.#set("toolbarField", value);
		this.#save();
	}

	/**
	 * Gets the toolbar field border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarFieldBorder(): number {
		return this.#content.toolbarFieldBorder;
	}

	/**
	 * Sets the toolbar field border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarFieldBorder(value: number) {
		this.#set("toolbarFieldBorder", value);
		this.#save();
	}

	/**
	 * Gets the toolbar field on focus brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarFieldOnFocus(): number {
		return this.#content.toolbarFieldOnFocus;
	}

	/**
	 * Sets the toolbar field on focus brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarFieldOnFocus(value: number) {
		this.#set("toolbarFieldOnFocus", value);
		this.#save();
	}

	/**
	 * Gets the sidebar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get sidebar(): number {
		return this.#content.sidebar;
	}

	/**
	 * Sets the sidebar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set sidebar(value: number) {
		this.#set("sidebar", value);
		this.#save();
	}

	/**
	 * Gets the sidebar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get sidebarBorder(): number {
		return this.#content.sidebarBorder;
	}

	/**
	 * Sets the sidebar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set sidebarBorder(value: number) {
		this.#set("sidebarBorder", value);
		this.#save();
	}

	/**
	 * Gets the popup brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get popup(): number {
		return this.#content.popup;
	}

	/**
	 * Sets the popup brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set popup(value: number) {
		this.#set("popup", value);
		this.#save();
	}

	/**
	 * Gets the popup border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get popupBorder(): number {
		return this.#content.popupBorder;
	}

	/**
	 * Sets the popup border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set popupBorder(value: number) {
		this.#set("popupBorder", value);
		this.#save();
	}

	/**
	 * Gets the minimum contrast ratio for light theme (times 10).
	 *
	 * @returns {number} The minimum contrast ratio (0-210).
	 */
	get minContrast_light(): number {
		return this.#content.minContrast_light;
	}

	/**
	 * Sets the minimum contrast ratio for light theme (times 10).
	 *
	 * @param {number} value - The minimum contrast ratio (0-210).
	 */
	set minContrast_light(value: number) {
		this.#set("minContrast_light", value);
		this.#save();
	}

	/**
	 * Gets the minimum contrast ratio for dark theme (times 10).
	 *
	 * @returns {number} The minimum contrast ratio (0-210).
	 */
	get minContrast_dark(): number {
		return this.#content.minContrast_dark;
	}

	/**
	 * Sets the minimum contrast ratio for dark theme (times 10).
	 *
	 * @param {number} value - The minimum contrast ratio (0-210).
	 */
	set minContrast_dark(value: number) {
		this.#set("minContrast_dark", value);
		this.#save();
	}

	/**
	 * Gets the home background colour for light theme.
	 *
	 * @returns {string} The background colour as a hex string.
	 */
	get homeBackground_light(): string {
		return this.#content.homeBackground_light;
	}

	/**
	 * Sets the home background colour for light theme.
	 *
	 * @param {string} value - The background colour as a hex string.
	 */
	set homeBackground_light(value: string) {
		this.#set("homeBackground_light", value);
		this.#save();
	}

	/**
	 * Gets the home background colour for dark theme.
	 *
	 * @returns {string} The background colour as a hex string.
	 */
	get homeBackground_dark(): string {
		return this.#content.homeBackground_dark;
	}

	/**
	 * Sets the home background colour for dark theme.
	 *
	 * @param {string} value - The background colour as a hex string.
	 */
	set homeBackground_dark(value: string) {
		this.#set("homeBackground_dark", value);
		this.#save();
	}

	/**
	 * Gets the fallback colour for light theme.
	 *
	 * @returns {string} The fallback colour as a hex string.
	 */
	get fallbackColour_light(): string {
		return this.#content.fallbackColour_light;
	}

	/**
	 * Sets the fallback colour for light theme.
	 *
	 * @param {string} value - The fallback colour as a hex string.
	 */
	set fallbackColour_light(value: string) {
		this.#set("fallbackColour_light", value);
		this.#save();
	}

	/**
	 * Gets the fallback colour for dark theme.
	 *
	 * @returns {string} The fallback colour as a hex string.
	 */
	get fallbackColour_dark(): string {
		return this.#content.fallbackColour_dark;
	}

	/**
	 * Sets the fallback colour for dark theme.
	 *
	 * @param {string} value - The fallback colour as a hex string.
	 */
	set fallbackColour_dark(value: string) {
		this.#set("fallbackColour_dark", value);
		this.#save();
	}

	/**
	 * Gets the site-specific policies list.
	 *
	 * @returns {RuleList} The rule list containing ID-keyed rule objects.
	 */
	get ruleList(): RuleList {
		return this.#content.ruleList;
	}

	/**
	 * Sets the site-specific policies list.
	 *
	 * @param {RuleList} value - The rule list containing ID-keyed rule objects.
	 */
	set ruleList(value: RuleList) {
		this.#set("ruleList", value);
		this.#save();
	}

	/**
	 * Gets the preferences version number.
	 *
	 * @returns {number[]} The version as an array of numbers.
	 */
	get version(): number[] {
		return this.#content.version;
	}

	/**
	 * Sets the preferences version number.
	 *
	 * @param {number[]} value - The version as an array of numbers.
	 */
	set version(value: number[]) {
		this.#set("version", value);
		this.#save();
	}
}
