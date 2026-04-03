import Icon from "@/components/Icon/Icon";
import styles from "./info.display.module.css";

export default function InfoDisplay({ cache }) {
	if (!cache || !cache.meta) return null;

	const { reason, info } = cache.meta;

	return (
		<div className={styles.infoDisplay}>
			<Icon type="info" />
			{(() => {
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
								<strong>{info}</strong>
								{i18n.t("colourIsPickedFromEnd")}
							</>
						);
					case "QS_FAILED":
						return (
							<>
								{i18n.t("cannotFindElement")}
								<strong>{info}</strong>
								{i18n.t("cannotFindElementEnd")}
							</>
						);
					case "QS_ERROR":
						return (
							<>
								{i18n.t("errorOccuredLocatingElement")}
								<strong>{info}</strong>
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
			})()}
		</div>
	);
}
