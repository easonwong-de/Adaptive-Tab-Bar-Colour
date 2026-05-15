import preference from "@/utils/preference";
import clsx from "clsx";
import { useSyncExternalStore } from "react";
import styles from "./ThemeTab.module.css";

interface ThemeTabProps {
	pref: preference;
	ready: boolean;
}

interface History {
	handle: keyof ThemeBuilderPreferenceContent;
	oldValue: number;
	newValue: number;
}

export default function ThemeTab({ pref, ready }: ThemeTabProps) {
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
		<main className={clsx(styles.themeTab, !ready && "disabled")}>
			<div className={styles.column}>
				<section className={clsx(pref.compatibilityMode && "disabled")}>
					<Glyph highlight="selectedTab" />
					<div>
						<h3>{i18n.t("selectedTab")}</h3>
						<div className={styles.sliderWrapper}>
							<Slider
								value={pref.tabSelected}
								onChange={(newValue) =>
									(pref.tabSelected = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory(
										"tabSelected",
										oldValue,
										newValue,
									)
								}
							/>
							<h4>{i18n.t("background")}</h4>
						</div>
						<div className={styles.sliderWrapper}>
							<Slider
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
							<h4>{i18n.t("border")}</h4>
						</div>
					</div>
				</section>
				<section className={clsx(pref.compatibilityMode && "disabled")}>
					<Glyph highlight="toolbar" />
					<div>
						<h3>{i18n.t("toolbar")}</h3>
						<div className={styles.sliderWrapper}>
							<Slider
								value={pref.toolbar}
								onChange={(newValue) =>
									(pref.toolbar = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory("toolbar", oldValue, newValue)
								}
							/>
							<h4>{i18n.t("background")}</h4>
						</div>
						<div className={styles.sliderWrapper}>
							<Slider
								value={pref.toolbarBorder}
								onChange={(newValue) =>
									(pref.toolbarBorder = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory(
										"toolbarBorder",
										oldValue,
										newValue,
									)
								}
							/>
							<h4>{i18n.t("border")}</h4>
						</div>
					</div>
				</section>
				<section className={clsx(pref.compatibilityMode && "disabled")}>
					<Glyph highlight="sidebar" />
					<div>
						<h3>{i18n.t("sidebar")}</h3>
						<div className={styles.sliderWrapper}>
							<Slider
								value={pref.sidebar}
								onChange={(newValue) =>
									(pref.sidebar = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory("sidebar", oldValue, newValue)
								}
							/>
							<h4>{i18n.t("background")}</h4>
						</div>
						<div className={styles.sliderWrapper}>
							<Slider
								value={pref.sidebarBorder}
								onChange={(newValue) =>
									(pref.sidebarBorder = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory(
										"sidebarBorder",
										oldValue,
										newValue,
									)
								}
							/>
							<h4>{i18n.t("border")}</h4>
						</div>
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
			<div className={styles.column}>
				<section>
					<Glyph highlight="tabBar" />
					<div>
						<h3>{i18n.t("tabBar")}</h3>
						<div className={styles.sliderWrapper}>
							<Slider
								value={pref.tabbar}
								onChange={(newValue) =>
									(pref.tabbar = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory("tabbar", oldValue, newValue)
								}
							/>
							<h4>{i18n.t("background")}</h4>
						</div>
						<div
							className={clsx(
								styles.sliderWrapper,
								pref.compatibilityMode && "disabled",
							)}
						>
							<Slider
								value={pref.tabbarBorder}
								onChange={(newValue) =>
									(pref.tabbarBorder = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory(
										"tabbarBorder",
										oldValue,
										newValue,
									)
								}
							/>
							<h4>
								{i18n.t("border")}
								<span
									className={styles.warning}
									title={i18n.t("ifVerticalTabsAreEnabled")}
								>
									<Icon type="warning" inline size="text" />
								</span>
							</h4>
						</div>
					</div>
				</section>
				<section className={clsx(pref.compatibilityMode && "disabled")}>
					<Glyph highlight="urlBar" />
					<div>
						<h3>{i18n.t("urlBar")}</h3>
						<div className={styles.sliderWrapper}>
							<Slider
								value={pref.toolbarField}
								onChange={(newValue) =>
									(pref.toolbarField = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory(
										"toolbarField",
										oldValue,
										newValue,
									)
								}
							/>
							<h4>{i18n.t("background")}</h4>
						</div>
						<div className={styles.sliderWrapper}>
							<Slider
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
							<h4>{i18n.t("backgroundOnFocus")}</h4>
						</div>
						<div className={styles.sliderWrapper}>
							<Slider
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
							<h4>{i18n.t("border")}</h4>
						</div>
					</div>
				</section>
				<section>
					<Glyph highlight="popup" />
					<div>
						<h3>{i18n.t("popUp")}</h3>
						<div className={styles.sliderWrapper}>
							<Slider
								value={pref.popup}
								onChange={(newValue) => (pref.popup = newValue)}
								onCommit={(oldValue, newValue) =>
									addHistory("popup", oldValue, newValue)
								}
							/>
							<h4>{i18n.t("background")}</h4>
						</div>
						<div
							className={clsx(
								styles.sliderWrapper,
								pref.compatibilityMode && "disabled",
							)}
						>
							<Slider
								value={pref.popupBorder}
								onChange={(newValue) =>
									(pref.popupBorder = newValue)
								}
								onCommit={(oldValue, newValue) =>
									addHistory(
										"popupBorder",
										oldValue,
										newValue,
									)
								}
							/>
							<h4>{i18n.t("border")}</h4>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
