export type Scheme = "light" | "dark";

export type BrowserColour =
	| "ADDON"
	| "COMPAT"
	| "DEFAULT"
	| "FALLBACK"
	| "HOME"
	| "IMAGE_VIEWER"
	| "JSON_VIEWER"
	| "LOG"
	| "MOTTO"
	| "PDF_VIEWER"
	| "PLAINTEXT"
	| "PRIVATE"
	| "PROCESS"
	| "PROFILE"
	| "SVG"
	| "SYSTEM"
	| "TOOLBOX";

export interface ColourRule {
	headerType: "URL" | "ADDON_ID";
	header: string;
	type: "COLOUR";
	value: string;
}

export interface ThemeColourRule {
	headerType: "URL";
	header: string;
	type: "THEME_COLOUR";
	value: boolean;
}

export interface QuerySelectorRule {
	headerType: "URL";
	header: string;
	type: "QUERY_SELECTOR";
	value: string;
}

export type Rule = ColourRule | ThemeColourRule | QuerySelectorRule | null;

export type RuleList = Record<number, Rule>;

export interface ThemeBuilderPreferenceContent {
	popup: number;
	popupBorder: number;
	sidebar: number;
	sidebarBorder: number;
	tabSelected: number;
	tabSelectedBorder: number;
	tabbar: number;
	tabbarBorder: number;
	toolbar: number;
	toolbarBorder: number;
	toolbarField: number;
	toolbarFieldBorder: number;
	toolbarFieldOnFocus: number;
}

export interface PreferenceContent extends ThemeBuilderPreferenceContent {
	// rule list
	ruleList: RuleList;
	// advanced
	accentColour_dark: string;
	accentColour_light: string;
	allowDarkLight: boolean;
	compatibilityMode: boolean;
	dynamic: boolean;
	fallbackColour_dark: string;
	fallbackColour_light: string;
	homeBackground_dark: string;
	homeBackground_light: string;
	minContrast_dark: number;
	minContrast_light: number;
	noThemeColour: boolean;
	overwriteAccentColour: boolean;
	// state
	lastSave: number;
	version: number[];
	[key: string]: PreferenceContent[keyof PreferenceContent];
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

export type TabSpecialColourData = "image" | "plaintext" | "svg" | "none";

export interface TabColourData {
	page: TabElementColourData[];
	theme: TabThemeColourData;
	query?: TabElementColourData;
	special: TabSpecialColourData;
}

export interface RuleQueryResult {
	id: number;
	url: string;
	webExtId?: string;
	rule: Rule;
}

export type TabMetaReason =
	| "ADDON_DEFAULT"
	| "ADDON_PRESET"
	| "ADDON_SPECIFIED"
	| "COLOUR_PICKED"
	| "COLOUR_SPECIFIED"
	| "ERROR_OCCURRED"
	| "FALLBACK_COLOUR"
	| "HOME_PAGE"
	| "IMAGE_VIEWER"
	| "JSON_VIEWER"
	| "PDF_VIEWER"
	| "PROTECTED_PAGE"
	| "QS_ERROR"
	| "QS_FAILED"
	| "QS_USED"
	| "TEXT_VIEWER"
	| "THEME_IGNORED"
	| "THEME_MISSING"
	| "THEME_UNIGNORED"
	| "THEME_USED";

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

export interface CacheData {
	ruleData: RuleQueryResult;
	metaData: MetaQueryResult;
	themeData: ApplyThemeResult;
}

export interface ColourCorrectionResult {
	colour: colour;
	scheme: Scheme;
	corrected: boolean;
}

export interface Theme {
	colors: Record<string, string>;
	properties: { color_scheme: "system"; content_color_scheme: "system" };
}

export type MessageForBackground =
	| { header: "UPDATE_COLOUR"; colour: TabColourData }
	| { header: "SCRIPT_READY" | "SCHEME_REQUEST" | "CACHE_REQUEST" };

export type MessageForPopup = { header: "CACHE_UPDATE"; cache: CacheData };

export type MessageForTab =
	| {
			header: "SETUP_SCRIPT";
			mode: "suspend" | "static" | "dynamic";
			query?: string;
	  }
	| { header: "SET_THEME_COLOUR"; colour: string };

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

export type GlyphHighlight =
	| "selectedTab"
	| "toolbar"
	| "tabBar"
	| "sidebar"
	| "popup"
	| "urlBar"
	| "none";

export type IconType =
	| "moon"
	| "sun"
	| "warning"
	| "delete"
	| "contrast"
	| "circle"
	| "undo"
	| "redo"
	| "reset"
	| "upload"
	| "download"
	| "info"
	| "redirect"
	| "border"
	| "background"
	| "backgroundOnFocus";
