import { useSyncExternalStore } from "react";
import Rule from "@/components/Rule/Rule";
import Icon from "@/components/Icon/Icon";
import type preference from "@/utils/preference";
import type {
	RuleQueryResult,
	MetaQueryResult,
	TabMetaReason,
} from "@/utils/types.js";
import styles from "./rule.widget.module.css";

interface RuleWidgetProps {
	pref: preference;
	rule: RuleQueryResult;
	meta: MetaQueryResult;
}

export default function RuleWidget({ pref, rule, meta }: RuleWidgetProps) {
	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	return (
		<section className={styles.ruleWidget}>
			<div className={styles.infoMessage}>
				<Icon type="info" />
				<ReasonText reason={meta.reason} info={meta.info} />
			</div>
			<RuleControls pref={pref} rule={rule} meta={meta} />
		</section>
	);
}

function ReasonText({
	reason,
	info,
}: {
	reason: TabMetaReason;
	info?: string;
}) {
	switch (reason) {
		case "COLOUR_PICKED":
			return i18n.t("colourPickedFromWebpage");
		case "COLOUR_SPECIFIED":
			return i18n.t("colourIsSpecified");
		case "THEME_USED":
			return i18n.t("usingThemeColour");
		case "THEME_MISSING":
			return i18n.t("themeColourNotFound");
		case "THEME_IGNORED":
			return i18n.t("themeColourIsIgnored");
		case "THEME_UNIGNORED":
			return i18n.t("themeColourIsUnignored");
		case "QS_USED":
			return (
				<>
					{i18n.t("colourIsPickedFrom")}
					<strong>
						<code>{info}</code>
					</strong>
					{i18n.t("colourIsPickedFromEnd")}
				</>
			);
		case "QS_FAILED":
			return (
				<>
					{i18n.t("cannotFindElement")}
					<strong>
						<code>{info}</code>
					</strong>
					{i18n.t("cannotFindElementEnd")}
				</>
			);
		case "QS_ERROR":
			return (
				<>
					{i18n.t("errorOccuredLocatingElement")}
					<strong>
						<code>{info}</code>
					</strong>
					{i18n.t("errorOccuredLocatingElementEnd")}
				</>
			);
		case "ADDON_SPECIFIED":
			return (
				<>
					{i18n.t("usingSpecifiedColourForAddon")}
					<strong>{info}</strong>
					{i18n.t("usingSpecifiedColourForAddonEnd")}
				</>
			);
		case "ADDON_PRESET":
			return (
				<>
					{i18n.t("usingPresetColourForAddon")}
					<strong>{info}</strong>
					{i18n.t("usingPresetColourForAddonEnd")}
				</>
			);
		case "ADDON_DEFAULT":
			return (
				<>
					{i18n.t("usingDefaultColourForAddon")}
					<strong>{info}</strong>
					{i18n.t("usingDefaultColourForAddonEnd")}
				</>
			);
		case "HOME_PAGE":
			return i18n.t("colourForHomePage");
		case "PROTECTED_PAGE":
			return i18n.t("pageIsProtected");
		case "IMAGE_VIEWER":
			return i18n.t("usingImageViewer");
		case "PDF_VIEWER":
			return i18n.t("colourForPDFViewer");
		case "JSON_VIEWER":
			return i18n.t("colourForJSONViewer");
		case "TEXT_VIEWER":
			return i18n.t("colourForPlainTextViewer");
		case "FALLBACK_COLOUR":
			return i18n.t("usingFallbackColour");
		default:
			return i18n.t("errorOccured");
	}
}

function RuleControls({
	pref,
	rule,
	meta,
}: {
	pref: preference;
	rule: RuleQueryResult;
	meta: MetaQueryResult;
}) {
	if (rule.id !== 0) {
		return (
			<>
				<Rule
					inPopup
					rule={rule.rule}
					onChange={(newRule) => pref.setRule(rule.id, newRule)}
				/>
				<button
					onClick={() => {
						pref.setRule(rule.id, null);
					}}
				>
					{i18n.t("deleteRule")}
				</button>
			</>
		);
	} else if (
		["THEME_IGNORED", "THEME_USED", "COLOUR_PICKED"].includes(meta.reason)
	) {
		try {
			const { hostname } = new URL(rule.query);
			return (
				<button
					onClick={() => {
						pref.addRule({
							headerType: "URL",
							header: hostname,
							type: "COLOUR",
							value: "#000000",
						});
					}}
				>
					{i18n.t("addANewRule")}
				</button>
			);
		} catch (e) {
			return null;
		}
	} else if (["ADDON_DEFAULT", "ADDON_PRESET"].includes(meta.reason)) {
		return (
			<button
				onClick={() => {
					pref.addRule({
						headerType: "ADDON_ID",
						header: rule.query,
						type: "COLOUR",
						value: "#000000",
					});
				}}
			>
				{i18n.t("addANewRule")}
			</button>
		);
	} else return null;
}
