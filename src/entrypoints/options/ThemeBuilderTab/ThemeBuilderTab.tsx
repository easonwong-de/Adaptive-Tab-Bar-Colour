import clsx from "clsx";
import { useMemo, useRef, useSyncExternalStore } from "react";
import type preference from "@/utils/preference";
import { ThemeBuilderPreferenceContent } from "@/utils/types";
import Confirm from "@/components/Confirm/Confirm";
import Glyph from "@/components/Glyph/Glyph";
import Icon from "@/components/Icon/Icon";
import Slider from "@/components/Slider/Slider";
import styles from "./theme.builder.module.css";

interface ThemeBuilderTabProps {
	pref: preference;
	ready: boolean;
}

interface History {
	handle: keyof ThemeBuilderPreferenceContent;
	oldValue: number;
	newValue: number;
}

export default function ThemeBuilderTab({ pref, ready }: ThemeBuilderTabProps) {
	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	const historyRef = useRef<History[]>([]);
	const headRef = useRef(-1);

	const canUndo = headRef.current >= 0;
	const canRedo = headRef.current < historyRef.current.length - 1;

	const addHistory = (
		handle: keyof ThemeBuilderPreferenceContent,
		oldValue: number,
		newValue: number,
	) => {
		if (oldValue === newValue) return;
		if (headRef.current < historyRef.current.length - 1) {
			historyRef.current = historyRef.current.slice(
				0,
				headRef.current + 1,
			);
		}
		historyRef.current.push({ handle, oldValue, newValue });
		if (historyRef.current.length > 100) historyRef.current.shift();
		headRef.current = historyRef.current.length - 1;
	};

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
							onChange={(newValue) =>
								(pref.tabSelected = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory("tabSelected", oldValue, newValue)
							}
						/>
						<Slider
							title={i18n.t("border")}
							value={pref.tabSelectedBorder}
							onChange={(newValue) =>
								(pref.tabSelectedBorder = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory(
									"tabSelectedBorder",
									oldValue,
									newValue,
								)
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
							onChange={(newValue) => (pref.tabbar = newValue)}
							onCommit={(oldValue, newValue) =>
								addHistory("tabbar", oldValue, newValue)
							}
						/>
						<Slider
							className={clsx(
								pref.compatibilityMode && "disabled",
							)}
							title={i18n.t("border")}
							warning={i18n.t("ifVerticalTabsAreEnabled")}
							value={pref.tabbarBorder}
							onChange={(newValue) =>
								(pref.tabbarBorder = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory("tabbarBorder", oldValue, newValue)
							}
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
							onChange={(newValue) => (pref.popup = newValue)}
							onCommit={(oldValue, newValue) =>
								addHistory("popup", oldValue, newValue)
							}
						/>
						<Slider
							className={clsx(
								pref.compatibilityMode && "disabled",
							)}
							title={i18n.t("border")}
							value={pref.popupBorder}
							onChange={(newValue) =>
								(pref.popupBorder = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory("popupBorder", oldValue, newValue)
							}
						/>
					</div>
				</section>
				<section className={styles.toolboxSection}>
					<button
						className={clsx(!canUndo && styles.unavailable)}
						onClick={() => {
							if (!canUndo) return;
							const item = historyRef.current[headRef.current];
							pref[item.handle] = item.oldValue;
							headRef.current -= 1;
						}}
					>
						<Icon type="undo" />
					</button>
					<button
						className={clsx(!canRedo && styles.unavailable)}
						onClick={() => {
							if (!canRedo) return;
							const item =
								historyRef.current[headRef.current + 1];
							pref[item.handle] = item.newValue;
							headRef.current += 1;
						}}
					>
						<Icon type="redo" />
					</button>
					<Confirm
						position="up"
						confirmText={i18n.t("confirmResetThemeBuilder")}
						onConfirm={() => {
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
							]);
							historyRef.current = [];
							headRef.current = -1;
						}}
					>
						{(open) => (
							<button
								className={styles.resetButton}
								onClick={open}
							>
								{i18n.t("resetAll")}
							</button>
						)}
					</Confirm>
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
							onChange={(newValue) =>
								(pref.toolbarField = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory("toolbarField", oldValue, newValue)
							}
						/>
						<Slider
							title={i18n.t("backgroundOnFocus")}
							value={pref.toolbarFieldOnFocus}
							onChange={(newValue) =>
								(pref.toolbarFieldOnFocus = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory(
									"toolbarFieldOnFocus",
									oldValue,
									newValue,
								)
							}
						/>
						<Slider
							title={i18n.t("border")}
							value={pref.toolbarFieldBorder}
							onChange={(newValue) =>
								(pref.toolbarFieldBorder = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory(
									"toolbarFieldBorder",
									oldValue,
									newValue,
								)
							}
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
							onChange={(newValue) => (pref.toolbar = newValue)}
							onCommit={(oldValue, newValue) =>
								addHistory("toolbar", oldValue, newValue)
							}
						/>
						<Slider
							title={i18n.t("border")}
							value={pref.toolbarBorder}
							onChange={(newValue) =>
								(pref.toolbarBorder = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory("toolbarBorder", oldValue, newValue)
							}
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
							onChange={(newValue) => (pref.sidebar = newValue)}
							onCommit={(oldValue, newValue) =>
								addHistory("sidebar", oldValue, newValue)
							}
						/>
						<Slider
							title={i18n.t("border")}
							value={pref.sidebarBorder}
							onChange={(newValue) =>
								(pref.sidebarBorder = newValue)
							}
							onCommit={(oldValue, newValue) =>
								addHistory("sidebarBorder", oldValue, newValue)
							}
						/>
					</div>
				</section>
			</div>
		</main>
	);
}
