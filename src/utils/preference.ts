import { defaultPreferenceContent as defaultContent } from "./constants";

export default class preference {
	/** The content of the preference. */
	#content: PreferenceContent = { ...defaultContent };

	/** State for storage writes and lifecycle. */
	#state: {
		lastWrite: number;
		isDisposed: boolean;
		writeTimeout?: ReturnType<typeof setTimeout>;
	} = { lastWrite: 0, isDisposed: false };

	/** The listener for preference changes. */
	#onChangeListener: () => void = () => {};

	/** Listener for storage changes. */
	#storageListener?: (
		changes: { [key: string]: Browser.storage.StorageChange },
		areaName: Browser.storage.AreaName,
	) => void;

	/**
	 * Initialises preferences from storage, normalises them, and registers
	 * storage listeners.
	 *
	 * @async
	 */
	async initialise(): Promise<void> {
		this.#state.isDisposed = false;
		if (this.#storageListener)
			removeStorageChangeListener(this.#storageListener);
		const storedContent = await getStorageContent();
		const { result, removedKeys } = this.#normalise(storedContent);
		await removeStorageKeys(removedKeys);
		for (const key in result)
			this.#set(key as keyof PreferenceContent, result[key]);
		if (!supportsThemeAPI()) this.#set("compatibilityMode", true);
		await this.#save();

		this.#storageListener = (changes, areaName) => {
			if (areaName !== "local" || this.#state.isDisposed) return;
			const nextLastSave = changes.lastSave?.newValue;
			if (
				typeof nextLastSave !== "number" ||
				nextLastSave <= this.#content.lastSave
			)
				return;
			let hasUpdates = false;
			for (const [key, change] of Object.entries(changes)) {
				if (!(key in this.#content)) continue;
				this.#set(key as keyof PreferenceContent, change.newValue);
				hasUpdates = true;
			}
			if (hasUpdates) this.syncUI();
		};
		addStorageChangeListener(this.#storageListener);
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
				if (key in defaultContent) this.#set(key, defaultContent[key]);
		} else this.#content = { ...defaultContent };
		await this.#save();
	}

	/**
	 * Saves preferences to storage with a debounce.
	 *
	 * @private
	 */
	async #save(): Promise<void> {
		if (this.#state.isDisposed) return;
		this.syncUI();
		if (this.#state.writeTimeout !== undefined)
			clearTimeout(this.#state.writeTimeout);
		this.#state.writeTimeout = setTimeout(
			async () => {
				if (this.#state.isDisposed) return;
				this.#state.lastWrite = Date.now();
				const lastSave = Date.now();
				const contentToSave = { ...this.#content, lastSave };
				const didSave = await setStorageContent(contentToSave);
				if (!didSave) return;
				this.#content.lastSave = lastSave;
				this.syncUI();
			},
			Math.max(0, 50 + this.#state.lastWrite - Date.now()),
		);
	}

	/**
	 * Sets and normalises a preference value.
	 *
	 * @private
	 * @param {keyof PreferenceContent} key - The preference key.
	 * @param {unknown} value - The value.
	 */
	#set(key: keyof PreferenceContent, value: unknown): void {
		switch (key) {
			case "popup":
			case "popupBorder":
			case "sidebar":
			case "sidebarBorder":
			case "tabSelected":
			case "tabSelectedBorder":
			case "tabbar":
			case "tabbarBorder":
			case "toolbar":
			case "toolbarBorder":
			case "toolbarField":
			case "toolbarFieldBorder":
			case "toolbarFieldOnFocus":
				this.#content[key] =
					typeof value === "number"
						? this.#normaliseNumber(value, {
								min: -50,
								max: 50,
								step: 1,
							})
						: defaultContent[key];
				break;
			case "ruleList":
				this.#content[key] = this.#normaliseRuleList(value);
				break;
			case "allowDarkLight":
			case "compatibilityMode":
			case "dynamic":
			case "noThemeColour":
				this.#content[key] =
					typeof value === "boolean" ? value : defaultContent[key];
				break;
			case "fallbackColour_dark":
			case "fallbackColour_light":
			case "homeBackground_dark":
			case "homeBackground_light":
				this.#content[key] =
					typeof value === "string" ? value : defaultContent[key];
				break;
			case "minContrast_light":
			case "minContrast_dark":
				this.#content[key] =
					typeof value === "number"
						? this.#normaliseNumber(value, {
								min: 0,
								max: 210,
								step: 5,
							})
						: defaultContent[key];
				break;
			default:
				break;
		}
	}

	/**
	 * Checks whether a value is a valid rule or `null`.
	 *
	 * @private
	 * @param {unknown} value - The value to validate.
	 * @returns {boolean} `true` if the value is a valid rule.
	 */
	#isRule(value: unknown): value is Rule {
		return (
			value === null ||
			(this.#isRecord(value) &&
				typeof value.header === "string" &&
				(((value.headerType === "URL" ||
					value.headerType === "ADDON_ID") &&
					value.type === "COLOUR" &&
					typeof value.value === "string") ||
					(value.headerType === "URL" &&
						((value.type === "THEME_COLOUR" &&
							typeof value.value === "boolean") ||
							(value.type === "QUERY_SELECTOR" &&
								typeof value.value === "string")))))
		);
	}

	/**
	 * Checks whether a value is a plain record.
	 *
	 * @private
	 * @param {unknown} value - The value to check.
	 * @returns {boolean} `true` if the value is a non-null, non-array object.
	 */
	#isRecord(
		value: unknown,
	): value is Record<string | number | symbol, unknown> {
		return (
			value !== undefined &&
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value)
		);
	}

	/**
	 * Checks whether a value is a numeric array.
	 *
	 * @private
	 * @param {unknown} value - The value to validate.
	 * @returns {boolean} `true` if the value is an array of numbers.
	 */
	#isNumberArray(value: unknown): value is number[] {
		return (
			value !== undefined &&
			value !== null &&
			Array.isArray(value) &&
			value.every((item) => typeof item === "number")
		);
	}

	/**
	 * Runs a migration callback when content version is older.
	 *
	 * @private
	 * @param {Record<string, unknown>} content - The stored content.
	 * @param {number[]} version - The target version threshold.
	 * @param {() => void} callback - The migration logic to run.
	 */
	#migrate(
		content: Record<string, unknown>,
		version: number[],
		callback: () => void,
	): void {
		if (this.#isNumberArray(content.version)) {
			for (let i = 0; i < 3; i++) {
				const contentPart = content.version[i] ?? 0;
				const targetPart = version[i] ?? 0;
				if (contentPart > targetPart) return;
				if (contentPart < targetPart) {
					callback();
					return;
				}
			}
			return;
		}
		callback();
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
		let merged: Record<string, unknown> = { ...defaultContent, ...content };
		const removedKeys: string[] = [];

		this.#migrate(content, [2, 2, 3], () => {
			merged = { ...content, ...defaultContent };
		});
		this.#migrate(content, [2, 4], () => {
			if (merged.minContrast_light === 165) merged.minContrast_light = 90;
		});
		this.#migrate(content, [4, 0], () => {
			merged.ruleList = this.#isRecord(content.siteList)
				? content.siteLit
				: {};
		});

		for (const key in merged) {
			if (!(key in defaultContent)) {
				delete merged[key];
				removedKeys.push(key);
			}
		}

		return {
			result: { ...merged, version } as PreferenceContent,
			removedKeys,
		};
	}

	/**
	 * Normalises a numeric preference within constraints.
	 *
	 * @param {number} num - The numeric input to evaluate.
	 * @param {Object} range - The bounding constraints.
	 * @param {number} range.min - The strict minimum threshold.
	 * @param {number} range.max - The strict maximum threshold.
	 * @param {number} range.step - The discrete interval for valid values.
	 * @returns {number} The constrained and rounded integer.
	 */
	#normaliseNumber(
		num: number,
		{ min, max, step }: { min: number; max: number; step: number },
	): number {
		if (-1 < num && num < 1) num = Math.round(num * 100);
		let clamped = clamp(min, num, max);
		const remainder = (clamped - min) % step;
		if (remainder !== 0) {
			clamped =
				remainder >= step / 2
					? clamped + (step - remainder)
					: clamped - remainder;
		}
		return Math.round(clamped);
	}

	/**
	 * Normalises a rule list.
	 *
	 * @private
	 * @param {unknown} value - The value to normalise.
	 * @returns {RuleList} The normalised rule list.
	 */
	#normaliseRuleList(value: unknown): RuleList {
		if (!this.#isRecord(value)) return {};
		const entries = Object.entries(value)
			.map(([id, rule]) => ({ id: Number(id), rule }))
			.filter(
				({ id, rule }) =>
					Number.isInteger(id) && id > 0 && this.#isRule(rule),
			)
			.sort((first, second) => first.id - second.id);
		const ruleList: RuleList = {};
		let id = 1;
		for (const entry of entries) {
			ruleList[id] = entry.rule as Rule;
			id++;
		}
		return ruleList;
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
		} catch {
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
		this.#onChangeListener = listener;
		return () => (this.#onChangeListener = () => {});
	}

	/**
	 * Synchronises the UI with the current preference state.
	 *
	 * @returns {void}
	 */
	syncUI(): void {
		this.#onChangeListener();
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
	 * @returns {Promise<void>} Resolves when the rule is saved.
	 */
	async addRule(rule: Rule): Promise<void> {
		let id = 1;
		while (id in this.#content.ruleList) id++;
		await this.setRule(id, rule);
	}

	/**
	 * Sets a rule by ID.
	 *
	 * @param {number} id - The rule ID.
	 * @param {Rule} rule - The rule object.
	 * @returns {Promise<void>} Resolves when the rule is saved.
	 */
	async setRule(id: number, rule: Rule): Promise<void> {
		if (!this.#isRule(rule)) return;
		this.#content.ruleList[id] = rule;
		await this.#save();
	}

	/**
	 * Finds the last matching rule for a URL.
	 *
	 * Supports rule header being:
	 *
	 * - ID of web extension
	 * - Full URL (& trailing slash)
	 * - Regular expression
	 * - Wildcard pattern:
	 *
	 *   - `**` matches any string of any length
	 *   - `*` matches any characters except `/`, `.`, and `:`
	 *   - `?` matches any single character
	 *   - Scheme (e.g., `https://`) is optional
	 * - Hostname (& path)
	 *
	 * @param {string} [url=""] - Site URL. Default is `""`
	 * @returns {Promise<RuleQueryResult>} Result.
	 */
	async getRule(url: string = ""): Promise<RuleQueryResult> {
		let id = 0;
		let rule: Rule = null;
		if (url === "") return { id, url, rule };
		const webExtId = await getWebExtId(url);
		for (const forId in this.#content.ruleList) {
			const forRule = this.#content.ruleList[forId];
			if (
				forRule === null ||
				typeof forRule.header !== "string" ||
				forRule.header === ""
			) {
				continue;
			} else if (
				webExtId !== undefined &&
				forRule.headerType === "ADDON_ID" &&
				forRule.header === webExtId
			) {
				id = +forId;
				rule = forRule;
			} else {
				const cleanUrl = url.replace(/\/$/, "");
				const cleanHeader = forRule.header.replace(/\/$/, "");
				if (
					forRule.headerType === "URL" &&
					(cleanUrl === cleanHeader ||
						this.#testRegex(cleanUrl, cleanHeader) ||
						this.#testWildcard(cleanUrl, cleanHeader) ||
						this.#testHostname(cleanUrl, cleanHeader))
				) {
					id = +forId;
					rule = forRule;
				}
			}
		}
		return { id, url, webExtId, rule };
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
		} catch {
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
			} catch {
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
		} catch {
			return false;
		}
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
	 * Gets the preferences version number.
	 *
	 * @returns {number[]} The version as an array of numbers.
	 */
	get version(): number[] {
		return this.#content.version;
	}

	/**
	 * Disposes storage listeners and pending writes.
	 *
	 * @returns {void}
	 */
	dispose(): void {
		this.#state.isDisposed = true;
		if (this.#state.writeTimeout !== undefined)
			clearTimeout(this.#state.writeTimeout);
		if (this.#storageListener)
			removeStorageChangeListener(this.#storageListener);
		this.#storageListener = undefined;
	}
}
