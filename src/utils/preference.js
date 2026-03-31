import { addonVersion, defaultPref } from "./constants.js";
import { supportsThemeAPI } from "./utility.js";
import colour from "./colour.js";

export default class preference {
	/** The content of the preference */
	#content = { ...defaultPref };

	/** The listener for preference changes */
	#listener = () => {};

	/** State for debouncing storage writes */
	#state = {
		lastWrite: 0,
		writeTimeout: null,
	};

	/**
	 * Initialises preferences from storage.
	 *
	 * @async
	 */
	async initialise() {
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
			if (newLastSave && newLastSave > this.#content.lastSave) {
				for (const key in changes) {
					if (key in this.#content) {
						this.#content[key] = changes[key].newValue;
					}
				}
				this.syncUI();
			}
		});
	}

	/**
	 * Resets preferences to default values.
	 *
	 * @async
	 * @param {string[]} [keys] - The preference keys to reset. If undefined,
	 *   resets all.
	 */
	async reset(keys = undefined) {
		if (keys) {
			for (const key of keys)
				if (key in defaultPref) this.#set(key, defaultPref[key]);
		} else this.#content = { ...defaultPref };
		await this.#save();
	}

	/**
	 * Saves preferences to storage.
	 *
	 * @async
	 * @private
	 */
	async #save() {
		this.#content.lastSave = Date.now();
		this.syncUI();
		if (this.#state.writeTimeout) clearTimeout(this.#state.writeTimeout);
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
	#set(key, value) {
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
	 * @param {object} rule - The rule to validate.
	 * @returns {boolean} `true` if the rule is valid.
	 */
	#validateRule(rule) {
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
	 * @param {number} min - The minimum allowed value.
	 * @param {number} max - The maximum allowed value.
	 * @param {number} step - The step size for rounding.
	 * @returns {number} The validated and adjusted number.
	 */
	#normaliseNumericPref(num, { min, max, step }) {
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
	 * @param {object} content - The stored preference content.
	 * @returns {{ result: object; removedKeys: string[] }} The normalised
	 *   preferences and removed keys.
	 */
	#normalise(content) {
		if (
			!this.#content.version ||
			this.#isOlderThan([2, 0]) ||
			JSON.stringify(this.#content.version) === "[2,2,1]"
		) {
			return { result: { ...defaultPref }, removedKeys: [] };
		} else {
			const result = { ...defaultPref, ...content };
			if (this.#isOlderThan([2, 2])) {
				this.#content.allowDarkLight = true;
				this.#content.dynamic = true;
				this.#content.noThemeColour = true;
				const siteList = {};
				let id = 1;
				for (const site in result.siteList) {
					const policy = result.siteList[site];
					if (typeof policy !== "string") {
						continue;
					} else if (policy === "IGNORE_THEME") {
						siteList[id++] = {
							headerType: "URL",
							header: site,
							type: "THEME_COLOUR",
							value: false,
						};
					} else if (policy === "UN_IGNORE_THEME") {
						siteList[id++] = {
							headerType: "URL",
							header: site,
							type: "THEME_COLOUR",
							value: true,
						};
					} else if (policy.startsWith("QS_")) {
						siteList[id++] = {
							headerType: "URL",
							header: site,
							type: "QUERY_SELECTOR",
							value: policy.replace("QS_", ""),
						};
					} else if (site.startsWith("Add-on ID: ")) {
						siteList[id++] = {
							headerType: "ADDON_ID",
							header: site.replace("Add-on ID: ", ""),
							type: "COLOUR",
							value: new colour(policy, false).toHex(),
						};
					} else {
						siteList[id++] = {
							headerType: "URL",
							header: site,
							type: "COLOUR",
							value: new colour(policy, false).toHex(),
						};
					}
				}
				result.siteList = siteList;
			}
			if (this.#isOlderThan([2, 4])) {
				browser.theme.reset();
				if (result.minContrast_light === 165)
					result.minContrast_light = 90;
			}
			if (this.#isOlderThan([3, 4])) {
				if (result.siteList) result.ruleList = result.siteList;
			}
			const removedKeys = [];
			for (const key in result) {
				if (!(key in defaultPref)) {
					delete result[key];
					removedKeys.push(key);
				}
			}
			result.version = addonVersion;
			return { result, removedKeys };
		}
	}

	/**
	 * Checks if the current preference version is older than the given version.
	 *
	 * @private
	 * @param {number[]} version - The version array to compare against.
	 * @returns {boolean} `true` if older, `false` otherwise.
	 */
	#isOlderThan(version) {
		const currentVersion = this.#content.version || [];
		for (
			let i = 0;
			i < Math.max(currentVersion.length, version.length);
			i++
		) {
			if ((currentVersion[i] || 0) !== (version[i] || 0))
				return (currentVersion[i] || 0) < (version[i] || 0);
		}
		return false;
	}

	/**
	 * Returns preferences as JSON.
	 *
	 * @returns {string} The JSON string.
	 */
	exportJSON() {
		return JSON.stringify(this.#content);
	}

	/**
	 * Imports preferences from JSON.
	 *
	 * @async
	 * @param {string} jsonString - The JSON string.
	 * @returns {Promise<boolean>} `true` if successful.
	 */
	async importPref(jsonString) {
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
	 * @param {Function} listener - The callback function.
	 * @returns {Function} A function to remove the listener.
	 */
	setOnChangeListener(listener) {
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
	getLastSave() {
		return this.#content.lastSave;
	}

	/**
	 * Adds a rule to the rule list.
	 *
	 * @async
	 * @param {object} rule - The rule object.
	 */
	async addRule(rule) {
		let id = 1;
		while (id in this.#content.ruleList) id++;
		await this.setRule(id, rule);
	}

	/**
	 * Sets a rule by ID.
	 *
	 * @async
	 * @param {number} id - The rule ID.
	 * @param {object} rule - The rule object.
	 */
	async setRule(id, rule) {
		if (!this.#validateRule(rule)) return;
		this.#content.ruleList[id] = rule;
		await this.#save();
	}

	/**
	 * Finds a rule matching the query.
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
	 * @param {string} query - Site URL or add-on ID.
	 * @returns {{ id: number; rule: object | undefined }} Result.
	 */
	getRule(query) {
		let matchedId = 0;
		let matchedRule;
		if (typeof query !== "string")
			return { id: matchedId, rule: matchedRule };
		for (const id in this.#content.ruleList) {
			const rule = this.#content.ruleList[id];
			if (!rule || typeof rule.header !== "string") continue;
			const cleanQuery = query.replace(/\/$/, "");
			const cleanHeader = rule.header.replace(/\/$/, "");
			const isMatch =
				(rule.headerType === "ADDON_ID" && rule.header === query) ||
				(rule.headerType === "URL" &&
					(cleanQuery === cleanHeader ||
						this.#testRegex(cleanQuery, cleanHeader) ||
						this.#testWildcard(cleanQuery, cleanHeader) ||
						this.#testHostname(cleanQuery, cleanHeader)));
			if (isMatch) {
				matchedId = +id;
				matchedRule = rule;
			} else {
				continue;
			}
		}
		return { id: matchedId, rule: matchedRule };
	}

	/**
	 * Tests if a URL matches a regular expression pattern.
	 *
	 * @private
	 * @param {string} url - The URL to test.
	 * @param {string} regex - The regular expression pattern.
	 * @returns {boolean} `true` if the URL matches the pattern, `false`
	 *   otherwise.
	 */
	#testRegex(url, regex) {
		try {
			return new RegExp(`^${regex}$`, "i").test(url);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Tests if a URL matches a wildcard pattern.
	 *
	 * Converts wildcard patterns to regular expressions and tests the URL.
	 * Supports `**` (match all), `*` (match except `/.:`) and `?` (single
	 * char).
	 *
	 * @private
	 * @param {string} url - The URL to test.
	 * @param {string} wildcard - The wildcard pattern.
	 * @returns {boolean} `true` if the URL matches the pattern, `false`
	 *   otherwise.
	 */
	#testWildcard(url, wildcard) {
		if (wildcard.includes("*") || wildcard.includes("?")) {
			try {
				const wildcardPattern = wildcard
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
	 * @param {string} hostname - The hostname to match.
	 * @returns {boolean} `true` if the URL's hostname (with optional
	 *   subdomains) and path match, `false` otherwise.
	 */
	#testHostname(url, hostname) {
		try {
			const { hostname: urlHost, pathname } = new URL(url);
			const hostPart = hostname.split("/")[0];
			if (urlHost !== hostPart && !urlHost.endsWith(`.${hostPart}`))
				return false;
			const urlPath = hostPart + pathname;
			return urlPath === hostname || urlPath.startsWith(`${hostname}/`);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Gets whether dark/light scheme switching is allowed.
	 *
	 * @returns {boolean} `true` if scheme switching is allowed.
	 */
	get allowDarkLight() {
		return this.#content.allowDarkLight;
	}

	/**
	 * Sets whether dark/light scheme switching is allowed.
	 *
	 * @param {boolean} value - Whether to allow scheme switching.
	 */
	set allowDarkLight(value) {
		this.#set("allowDarkLight", value);
		this.#save();
	}

	/**
	 * Gets whether dynamic colour extraction is enabled.
	 *
	 * @returns {boolean} `true` if dynamic colour extraction is enabled.
	 */
	get dynamic() {
		return this.#content.dynamic;
	}

	/**
	 * Sets whether dynamic colour extraction is enabled.
	 *
	 * @param {boolean} value - Whether to enable dynamic colour extraction.
	 */
	set dynamic(value) {
		this.#set("dynamic", value);
		this.#save();
	}

	/**
	 * Gets whether theme colour should be ignored by default.
	 *
	 * @returns {boolean} `true` if theme colours are ignored by default.
	 */
	get noThemeColour() {
		return this.#content.noThemeColour;
	}

	/**
	 * Sets whether theme colour should be ignored by default.
	 *
	 * @param {boolean} value - Whether to ignore theme colours by default.
	 */
	set noThemeColour(value) {
		this.#set("noThemeColour", value);
		this.#save();
	}

	/**
	 * Gets whether compatibility mode is enabled.
	 *
	 * @returns {boolean} `true` if compatibility mode is enabled.
	 */
	get compatibilityMode() {
		return this.#content.compatibilityMode;
	}

	/**
	 * Sets whether compatibility mode is enabled.
	 *
	 * @param {boolean} value - Whether to enable compatibility mode.
	 */
	set compatibilityMode(value) {
		this.#set("compatibilityMode", value);
		this.#save();
	}

	/**
	 * Gets the tab bar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabbar() {
		return this.#content.tabbar;
	}

	/**
	 * Sets the tab bar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabbar(value) {
		this.#set("tabbar", value);
		this.#save();
	}

	/**
	 * Gets the tab bar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabbarBorder() {
		return this.#content.tabbarBorder;
	}

	/**
	 * Sets the tab bar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabbarBorder(value) {
		this.#set("tabbarBorder", value);
		this.#save();
	}

	/**
	 * Gets the selected tab brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabSelected() {
		return this.#content.tabSelected;
	}

	/**
	 * Sets the selected tab brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabSelected(value) {
		this.#set("tabSelected", value);
		this.#save();
	}

	/**
	 * Gets the selected tab border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabSelectedBorder() {
		return this.#content.tabSelectedBorder;
	}

	/**
	 * Sets the selected tab border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabSelectedBorder(value) {
		this.#set("tabSelectedBorder", value);
		this.#save();
	}

	/**
	 * Gets the toolbar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbar() {
		return this.#content.toolbar;
	}

	/**
	 * Sets the toolbar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbar(value) {
		this.#set("toolbar", value);
		this.#save();
	}

	/**
	 * Gets the toolbar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarBorder() {
		return this.#content.toolbarBorder;
	}

	/**
	 * Sets the toolbar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarBorder(value) {
		this.#set("toolbarBorder", value);
		this.#save();
	}

	/**
	 * Gets the toolbar field brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarField() {
		return this.#content.toolbarField;
	}

	/**
	 * Sets the toolbar field brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarField(value) {
		this.#set("toolbarField", value);
		this.#save();
	}

	/**
	 * Gets the toolbar field border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarFieldBorder() {
		return this.#content.toolbarFieldBorder;
	}

	/**
	 * Sets the toolbar field border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarFieldBorder(value) {
		this.#set("toolbarFieldBorder", value);
		this.#save();
	}

	/**
	 * Gets the toolbar field on focus brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarFieldOnFocus() {
		return this.#content.toolbarFieldOnFocus;
	}

	/**
	 * Sets the toolbar field on focus brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarFieldOnFocus(value) {
		this.#set("toolbarFieldOnFocus", value);
		this.#save();
	}

	/**
	 * Gets the sidebar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get sidebar() {
		return this.#content.sidebar;
	}

	/**
	 * Sets the sidebar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set sidebar(value) {
		this.#set("sidebar", value);
		this.#save();
	}

	/**
	 * Gets the sidebar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get sidebarBorder() {
		return this.#content.sidebarBorder;
	}

	/**
	 * Sets the sidebar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set sidebarBorder(value) {
		this.#set("sidebarBorder", value);
		this.#save();
	}

	/**
	 * Gets the popup brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get popup() {
		return this.#content.popup;
	}

	/**
	 * Sets the popup brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set popup(value) {
		this.#set("popup", value);
		this.#save();
	}

	/**
	 * Gets the popup border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get popupBorder() {
		return this.#content.popupBorder;
	}

	/**
	 * Sets the popup border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set popupBorder(value) {
		this.#set("popupBorder", value);
		this.#save();
	}

	/**
	 * Gets the minimum contrast ratio for light theme (times 10).
	 *
	 * @returns {number} The minimum contrast ratio (0-210).
	 */
	get minContrast_light() {
		return this.#content.minContrast_light;
	}

	/**
	 * Sets the minimum contrast ratio for light theme (times 10).
	 *
	 * @param {number} value - The minimum contrast ratio (0-210).
	 */
	set minContrast_light(value) {
		this.#set("minContrast_light", value);
		this.#save();
	}

	/**
	 * Gets the minimum contrast ratio for dark theme (times 10).
	 *
	 * @returns {number} The minimum contrast ratio (0-210).
	 */
	get minContrast_dark() {
		return this.#content.minContrast_dark;
	}

	/**
	 * Sets the minimum contrast ratio for dark theme (times 10).
	 *
	 * @param {number} value - The minimum contrast ratio (0-210).
	 */
	set minContrast_dark(value) {
		this.#set("minContrast_dark", value);
		this.#save();
	}

	/**
	 * Gets the home background colour for light theme.
	 *
	 * @returns {string} The background colour as a hex string.
	 */
	get homeBackground_light() {
		return this.#content.homeBackground_light;
	}

	/**
	 * Sets the home background colour for light theme.
	 *
	 * @param {string} value - The background colour as a hex string.
	 */
	set homeBackground_light(value) {
		this.#set("homeBackground_light", value);
		this.#save();
	}

	/**
	 * Gets the home background colour for dark theme.
	 *
	 * @returns {string} The background colour as a hex string.
	 */
	get homeBackground_dark() {
		return this.#content.homeBackground_dark;
	}

	/**
	 * Sets the home background colour for dark theme.
	 *
	 * @param {string} value - The background colour as a hex string.
	 */
	set homeBackground_dark(value) {
		this.#set("homeBackground_dark", value);
		this.#save();
	}

	/**
	 * Gets the fallback colour for light theme.
	 *
	 * @returns {string} The fallback colour as a hex string.
	 */
	get fallbackColour_light() {
		return this.#content.fallbackColour_light;
	}

	/**
	 * Sets the fallback colour for light theme.
	 *
	 * @param {string} value - The fallback colour as a hex string.
	 */
	set fallbackColour_light(value) {
		this.#set("fallbackColour_light", value);
		this.#save();
	}

	/**
	 * Gets the fallback colour for dark theme.
	 *
	 * @returns {string} The fallback colour as a hex string.
	 */
	get fallbackColour_dark() {
		return this.#content.fallbackColour_dark;
	}

	/**
	 * Sets the fallback colour for dark theme.
	 *
	 * @param {string} value - The fallback colour as a hex string.
	 */
	set fallbackColour_dark(value) {
		this.#set("fallbackColour_dark", value);
		this.#save();
	}

	/**
	 * Gets the site-specific policies list.
	 *
	 * @returns {object} The rule list containing ID-keyed rule objects.
	 */
	get ruleList() {
		return this.#content.ruleList;
	}

	/**
	 * Sets the site-specific policies list.
	 *
	 * @param {object} value - The rule list containing ID-keyed rule objects.
	 */
	set ruleList(value) {
		this.#set("ruleList", value);
		this.#save();
	}

	/**
	 * Gets the preferences version number.
	 *
	 * @returns {number[]} The version as an array of numbers.
	 */
	get version() {
		return this.#content.version;
	}

	/**
	 * Sets the preferences version number.
	 *
	 * @param {number[]} value - The version as an array of numbers.
	 */
	set version(value) {
		this.#set("version", value);
		this.#save();
	}
}
