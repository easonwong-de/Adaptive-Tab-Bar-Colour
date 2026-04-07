import clsx from "clsx";
import Glyph from "@/components/Glyph/Glyph";
import { useSyncExternalStore } from "react";
import styles from "./theme.builder.module.css";
import Slider from "@/components/Slider/Slider";
import type preference from "@/utils/preference";

interface ThemeBuilderTabProps {
	pref: preference;
	ready: boolean;
}

export default function ThemeBuilderTab({ pref, ready }: ThemeBuilderTabProps) {
	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	return (
		<main className={clsx(styles.themeBuilderTab, !ready && "disabled")}>
			<div className={styles.column}>
				<section className={clsx(pref.compatibilityMode && "disabled")}>
					<Glyph highlight="tab" />
					<div>
						<h3>{i18n.t("selectedTab")}</h3>
						<Slider
							title={i18n.t("background")}
							value={pref.tabSelected}
							onChange={(value) => (pref.tabSelected = value)}
						/>
						<Slider
							title={i18n.t("border")}
							value={pref.tabSelectedBorder}
							onChange={(value) =>
								(pref.tabSelectedBorder = value)
							}
						/>
					</div>
				</section>
				<section>
					<Glyph highlight="tab-bar" />
					<div>
						<h3>{i18n.t("tabBar")}</h3>
						<Slider
							title={i18n.t("background")}
							value={pref.tabbar}
							onChange={(value) => {
								pref.tabbar = value;
							}}
						/>
						<Slider
							className={clsx(
								pref.compatibilityMode && "disabled",
							)}
							title={i18n.t("border")}
							warning={i18n.t("ifVerticalTabsAreEnabled")}
							value={pref.tabbarBorder}
							onChange={(value) => {
								pref.tabbarBorder = value;
							}}
						/>
					</div>
				</section>
				<section>
					<Glyph highlight="popup" />
					<div>
						<h3>{i18n.t("popUp")}</h3>
						<Slider
							title={i18n.t("background")}
							value={pref.popup}
							onChange={(value) => {
								pref.popup = value;
							}}
						/>
						<Slider
							className={clsx(
								pref.compatibilityMode && "disabled",
							)}
							title={i18n.t("border")}
							value={pref.popupBorder}
							onChange={(value) => {
								pref.popupBorder = value;
							}}
						/>
					</div>
				</section>
			</div>
			<div
				className={clsx(
					styles.column,
					pref.compatibilityMode && "disabled",
				)}
			>
				<section>
					<Glyph highlight="url-bar" />
					<div>
						<h3>{i18n.t("urlBar")}</h3>
						<Slider
							title={i18n.t("background")}
							value={pref.toolbarField}
							onChange={(value) => {
								pref.toolbarField = value;
							}}
						/>
						<Slider
							title={i18n.t("backgroundOnFocus")}
							value={pref.toolbarFieldOnFocus}
							onChange={(value) => {
								pref.toolbarFieldOnFocus = value;
							}}
						/>
						<Slider
							title={i18n.t("border")}
							value={pref.toolbarFieldBorder}
							onChange={(value) => {
								pref.toolbarFieldBorder = value;
							}}
						/>
					</div>
				</section>
				<section>
					<Glyph highlight="toolbar" />
					<div>
						<h3>{i18n.t("toolbar")}</h3>
						<Slider
							title={i18n.t("background")}
							value={pref.toolbar}
							onChange={(value) => (pref.toolbar = value)}
						/>
						<Slider
							title={i18n.t("border")}
							value={pref.toolbarBorder}
							onChange={(value) => {
								pref.toolbarBorder = value;
							}}
						/>
					</div>
				</section>
				<section>
					<Glyph highlight="sidebar" />
					<div>
						<h3>{i18n.t("sidebar")}</h3>
						<Slider
							title={i18n.t("background")}
							value={pref.sidebar}
							onChange={(value) => {
								pref.sidebar = value;
							}}
						/>
						<Slider
							title={i18n.t("border")}
							value={pref.sidebarBorder}
							onChange={(value) => {
								pref.sidebarBorder = value;
							}}
						/>
					</div>
				</section>
			</div>
		</main>
	);
}
