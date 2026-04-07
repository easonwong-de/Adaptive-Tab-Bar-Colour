import colour from "./colour.js";

export type Scheme = "light" | "dark";

export interface UrlColourRule {
	headerType: "URL";
	header: string;
	type: "COLOUR";
	value: string;
}

export interface UrlThemeColourRule {
	headerType: "URL";
	header: string;
	type: "THEME_COLOUR";
	value: boolean;
}

export interface UrlQuerySelectorRule {
	headerType: "URL";
	header: string;
	type: "QUERY_SELECTOR";
	value: string;
}

export interface AddonColourRule {
	headerType: "ADDON_ID";
	header: string;
	type: "COLOUR";
	value: string;
}

export type Rule =
	| UrlColourRule
	| UrlThemeColourRule
	| UrlQuerySelectorRule
	| AddonColourRule
	| null;

export type RuleList = Record<number, Rule>;

export interface PreferenceContent {
	tabbar: number;
	tabbarBorder: number;
	tabSelected: number;
	tabSelectedBorder: number;
	toolbar: number;
	toolbarBorder: number;
	toolbarField: number;
	toolbarFieldBorder: number;
	toolbarFieldOnFocus: number;
	sidebar: number;
	sidebarBorder: number;
	popup: number;
	popupBorder: number;
	ruleList: RuleList;
	minContrast_light: number;
	minContrast_dark: number;
	allowDarkLight: boolean;
	dynamic: boolean;
	noThemeColour: boolean;
	compatibilityMode: boolean;
	homeBackground_light: string;
	homeBackground_dark: string;
	fallbackColour_light: string;
	fallbackColour_dark: string;
	version: number[];
	lastSave: number;
	[key: string]: unknown;
}

export interface RuleQueryResult {
	id: number;
	query: string;
	rule: Rule;
}

export interface TabThemeColourData {
	light?: string;
	dark?: string;
}

export interface TabElementColourData {
	colour: string;
	opacity: string;
	filter: string;
}

export interface TabColourData {
	theme: TabThemeColourData;
	page: TabElementColourData[];
	query?: TabElementColourData;
	image: boolean;
}

export type TabMetaReason =
	| "COLOUR_PICKED"
	| "COLOUR_SPECIFIED"
	| "THEME_USED"
	| "THEME_MISSING"
	| "THEME_IGNORED"
	| "THEME_UNIGNORED"
	| "QS_USED"
	| "QS_FAILED"
	| "QS_ERROR"
	| "ADDON_SPECIFIED"
	| "ADDON_PRESET"
	| "ADDON_DEFAULT"
	| "HOME_PAGE"
	| "PROTECTED_PAGE"
	| "IMAGE_VIEWER"
	| "PDF_VIEWER"
	| "JSON_VIEWER"
	| "TEXT_VIEWER"
	| "FALLBACK_COLOUR"
	| "ERROR_OCCURRED";

export interface MetaQueryResult {
	colour: colour;
	reason: TabMetaReason;
	info?: string;
}

export interface ApplyThemeResult {
	popupColour: string;
	scheme: Scheme;
	corrected: boolean;
}

export interface Cache {
	rule: RuleQueryResult;
	meta: MetaQueryResult;
	theme: ApplyThemeResult;
}

export interface Theme {
	colors: Record<string, string>;
	properties: {
		color_scheme: "system";
		content_color_scheme: "system";
	};
}

export type MessageForBackground =
	| {
			header: "UPDATE_COLOUR";
			colour: TabColourData;
	  }
	| {
			header: "SCRIPT_READY" | "SCHEME_REQUEST" | "CACHE_REQUEST";
	  };

export type MessageForPopup = {
	header: "CACHE_UPDATE";
};

export type MessageForTab =
	| {
			header: "GET_COLOUR";
			dynamic: boolean;
			query: string | undefined;
	  }
	| {
			header: "SET_THEME_COLOUR";
			colour: string;
	  };

export type BackgroundMessageListener = (
	message: MessageForBackground,
	sender: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
) => unknown;

export type PopupMessageListener = (
	message: MessageForPopup,
	sender: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
) => unknown;

export type TabMessageListener = (
	message: MessageForTab,
	sender: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
) => unknown;
