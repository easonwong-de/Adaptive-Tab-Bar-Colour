import clsx from "clsx";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type preference from "@/utils/preference";
import { addSchemeChangeListener, getSystemScheme } from "@/utils/utility";
import Colour from "@/components/Colour/Colour";
import Confirm from "@/components/Confirm/Confirm";
import Icon from "@/components/Icon/Icon";
import Slider from "@/components/Slider/Slider";
import Switch from "@/components/Switch/Switch";
import styles from "./advanced.settings.module.css";

interface AdvancedSettingsTabProps {
	pref: preference;
	ready: boolean;
}

export default function AdvancedSettingsTab({
	pref,
	ready,
}: AdvancedSettingsTabProps) {
	const [scheme, setScheme] = useState(getSystemScheme());
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);
	useEffect(() => {
		addSchemeChangeListener(() => setScheme(getSystemScheme()));
	}, []);

	return (
		<main
			className={clsx(styles.advancedSettingsTab, !ready && "disabled")}
		>
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
					<div>{i18n.t("homepageColourLight")}</div>
					<div>
						<Colour
							value={pref.homeBackground_light}
							onChange={(value) =>
								(pref.homeBackground_light = value)
							}
						/>
					</div>
					<div>
						<button
							className={styles.resetButton}
							onClick={() => pref.reset(["homeBackground_light"])}
						>
							<Icon type="reset" />
						</button>
					</div>
					<div>{i18n.t("homepageColourDark")}</div>
					<div>
						<Colour
							value={pref.homeBackground_dark}
							onChange={(value) =>
								(pref.homeBackground_dark = value)
							}
						/>
					</div>
					<div>
						<button
							className={styles.resetButton}
							onClick={() => pref.reset(["homeBackground_dark"])}
						>
							<Icon type="reset" />
						</button>
					</div>
					<div>{i18n.t("fallbackColourLight")}</div>
					<div>
						<Colour
							value={pref.fallbackColour_light}
							onChange={(value) =>
								(pref.fallbackColour_light = value)
							}
						/>
					</div>
					<div>
						<button
							className={styles.resetButton}
							onClick={() => pref.reset(["fallbackColour_light"])}
						>
							<Icon type="reset" />
						</button>
					</div>
					<div>{i18n.t("fallbackColourDark")}</div>
					<div>
						<Colour
							value={pref.fallbackColour_dark}
							onChange={(value) =>
								(pref.fallbackColour_dark = value)
							}
						/>
					</div>
					<div>
						<button
							className={styles.resetButton}
							onClick={() => pref.reset(["fallbackColour_dark"])}
						>
							<Icon type="reset" />
						</button>
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
					<h3>{i18n.t("backup")}</h3>
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
				</section>
				<section className={styles.cardSection}>
					<h3>{i18n.t("reset")}</h3>
					<Confirm
						confirmText={i18n.t("confirmResetThemeBuilder")}
						onConfirm={() =>
							pref.reset([
								"tabbar",
								"tabbarBorder",
								"tabSelected",
								"tabSelectedBorder",
								"toolbar",
								"toolbarBorder",
								"toolbarField",
								"toolbarFieldBorder",
								"toolbarFieldOnFocus",
								"sidebar",
								"sidebarBorder",
								"popup",
								"popupBorder",
							])
						}
					>
						{({ setIsOpen, isOpen }) => (
							<button
								className={styles.textButton}
								onClick={() => setIsOpen(!isOpen)}
							>
								<Icon type="reset" />
								{i18n.t("resetThemeBuilder")}
							</button>
						)}
					</Confirm>
					<Confirm
						confirmText={i18n.t("confirmResetRuleList")}
						onConfirm={() => pref.reset(["ruleList"])}
					>
						{({ setIsOpen, isOpen }) => (
							<button
								className={styles.textButton}
								onClick={() => setIsOpen(!isOpen)}
							>
								<Icon type="reset" />
								{i18n.t("resetRuleList")}
							</button>
						)}
					</Confirm>
					<Confirm
						confirmText={i18n.t("confirmResetAdvanced")}
						onConfirm={() =>
							pref.reset([
								"minContrast_light",
								"minContrast_dark",
								"allowDarkLight",
								"dynamic",
								"noThemeColour",
								"compatibilityMode",
								"homeBackground_light",
								"homeBackground_dark",
								"fallbackColour_light",
								"fallbackColour_dark",
							])
						}
					>
						{({ setIsOpen, isOpen }) => (
							<button
								className={styles.textButton}
								onClick={() => setIsOpen(!isOpen)}
							>
								<Icon type="reset" />
								{i18n.t("resetAdvanced")}
							</button>
						)}
					</Confirm>
				</section>
			</div>
		</main>
	);
}
