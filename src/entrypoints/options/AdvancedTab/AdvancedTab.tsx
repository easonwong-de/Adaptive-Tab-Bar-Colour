import clsx from "clsx";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type preference from "@/utils/preference";
import { addSchemeChangeListener, getSystemScheme } from "@/utils/utility";
import Colour from "@/components/Colour/Colour";
import Confirm from "@/components/Confirm/Confirm";
import Icon from "@/components/Icon/Icon";
import Slider from "@/components/Slider/Slider";
import Switch from "@/components/Switch/Switch";
import styles from "./advanced.tab.module.css";

interface AdvancedTabProps {
	pref: preference;
	ready: boolean;
}

export default function AdvancedTab({ pref, ready }: AdvancedTabProps) {
	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	const [scheme, setScheme] = useState(getSystemScheme());
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		addSchemeChangeListener(() => setScheme(getSystemScheme()));
	}, []);

	return (
		<main className={clsx(styles.advancedTab, !ready && "disabled")}>
			<div className={styles.column}>
				<section
					className={clsx(
						styles.cardSection,
						pref.compatibilityMode && "disabled",
					)}
				>
					{scheme === "light" ? (
						<>
							<h3>{i18n.t("allowDarkTabBar")}</h3>
							<Switch
								label={i18n.t("allowDarkTabBarTooltip")}
								active={pref.allowDarkLight}
								onChange={(value) =>
									(pref.allowDarkLight = value)
								}
							/>
						</>
					) : (
						<>
							<h3>{i18n.t("allowLightTabBar")}</h3>
							<Switch
								label={i18n.t("allowLightTabBarTooltip")}
								active={pref.allowDarkLight}
								onChange={(value) =>
									(pref.allowDarkLight = value)
								}
							/>
						</>
					)}
				</section>
				<section className={styles.cardSection}>
					<h3>{i18n.t("dynamicColourUpdate")}</h3>
					<Switch
						label={i18n.t("dynamicModeTooltip")}
						active={pref.dynamic}
						onChange={(value) => (pref.dynamic = value)}
					/>
				</section>
				<section className={styles.cardSection}>
					<h3>{i18n.t("ignoreDesignatedThemeColour")}</h3>
					<Switch
						label={i18n.t("ignoreDesignatedThemeColourTooltip")}
						active={pref.noThemeColour}
						onChange={(value) => (pref.noThemeColour = value)}
					/>
				</section>
				<section className={styles.cardSection}>
					<h3>{i18n.t("compatibilityMode")}</h3>
					<Switch
						label={i18n.t("compatibilityModeTooltip")}
						active={pref.compatibilityMode}
						onChange={(value) => (pref.compatibilityMode = value)}
					/>
				</section>
				<section
					className={clsx(
						styles.listSection,
						pref.compatibilityMode && "disabled",
					)}
				>
					<div>
						<h3>{i18n.t("homepageColourLight")}</h3>
						<Colour
							value={pref.homeBackground_light}
							onChange={(value) =>
								(pref.homeBackground_light = value)
							}
						/>
					</div>
					<div>
						<h3>{i18n.t("homepageColourDark")}</h3>
						<Colour
							value={pref.homeBackground_dark}
							onChange={(value) =>
								(pref.homeBackground_dark = value)
							}
						/>
					</div>
					<div>
						<h3>{i18n.t("fallbackColourLight")}</h3>
						<Colour
							value={pref.fallbackColour_light}
							onChange={(value) =>
								(pref.fallbackColour_light = value)
							}
						/>
					</div>
					<div>
						<h3>{i18n.t("fallbackColourDark")}</h3>
						<Colour
							value={pref.fallbackColour_dark}
							onChange={(value) =>
								(pref.fallbackColour_dark = value)
							}
						/>
					</div>
				</section>
			</div>
			<div className={styles.column}>
				<section className={styles.cardSection}>
					<h3>{i18n.t("minimumContrast")}</h3>
					<p>{i18n.t("minimumContrastTooltip")}</p>
					<Slider
						title={i18n.t("inLightMode")}
						minValue={0}
						maxValue={210}
						minorStep={5}
						majorStep={15}
						value={pref.minContrast_light}
						leftIconType="circle"
						rightIconType="contrast"
						onDisplay={(value) => (value / 10).toFixed(1)}
						onChange={(value) => (pref.minContrast_light = value)}
					/>
					<Slider
						title={i18n.t("inDarkMode")}
						minValue={0}
						maxValue={210}
						minorStep={5}
						majorStep={15}
						value={pref.minContrast_dark}
						leftIconType="circle"
						rightIconType="contrast"
						onDisplay={(value) => (value / 10).toFixed(1)}
						onChange={(value) => (pref.minContrast_dark = value)}
					/>
				</section>
				<section className={styles.cardSection}>
					<h3>{i18n.t("backupAndReset")}</h3>
					<button
						className={styles.textButton}
						onClick={() => {
							const data = pref.exportJSON();
							const blob = new Blob([data], {
								type: "application/json",
							});
							const url = URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = url;
							a.download = "atbc_pref.json";
							a.click();
							URL.revokeObjectURL(url);
						}}
					>
						<Icon type="download" />
						{i18n.t("exportSettings")}
					</button>
					<button
						className={styles.textButton}
						onClick={() => fileInputRef.current?.click()}
					>
						<Icon type="upload" />
						{i18n.t("importSettings")}
					</button>
					<input
						type="file"
						accept="application/json"
						className="hidden"
						ref={fileInputRef}
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (!file) return;
							const reader = new FileReader();
							reader.onload = () => {
								const result = reader.result;
								if (typeof result !== "string") return;
								pref.importPref(result);
								e.target.value = "";
							};
							reader.readAsText(file);
						}}
					/>
					<Confirm
						confirmText={i18n.t("confirmResetAll")}
						onConfirm={() => pref.reset()}
					>
						{(open) => (
							<button
								className={styles.textButton}
								onClick={open}
							>
								<Icon type="reset" />
								{i18n.t("resetAllSettings")}
							</button>
						)}
					</Confirm>
				</section>
			</div>
		</main>
	);
}
