import clsx from "clsx";
import { useSyncExternalStore } from "react";
import styles from "./ThemeWidget.module.css";

interface ThemeWidgetProps {
	ready: boolean;
	pref: preference;
}

export default function ThemeWidget({ ready, pref }: ThemeWidgetProps) {
	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	const [hover, setHover] = useState<GlyphHighlight>("none");

	return (
		<section className={clsx(styles.themeWidget, !ready && "disabled")}>
			<h2>{i18n.t("themeBuilder")}</h2>
			<div className={styles.glyphWrapper}>
				<Glyph highlight={hover} />
				<div>
					<p>{i18n.t("background")}</p>
					{hover === "url-bar" && (
						<p>{i18n.t("backgroundOnFocus")}</p>
					)}
					<p>{i18n.t("border")}</p>
				</div>
			</div>
			<hr />
			<div className={styles.panelWrapper}>
				<div>
					<div
						onMouseEnter={() => setHover("tab")}
						onMouseLeave={() => setHover("none")}
					>
						<h3>{i18n.t("selectedTab")}</h3>
					</div>
					<div
						onMouseEnter={() => setHover("tab-bar")}
						onMouseLeave={() => setHover("none")}
					>
						<h3>{i18n.t("tabBar")}</h3>
					</div>
					<div
						onMouseEnter={() => setHover("popup")}
						onMouseLeave={() => setHover("none")}
					>
						<h3>{i18n.t("popUp")}</h3>
					</div>
				</div>
				<div>
					<div
						onMouseEnter={() => setHover("url-bar")}
						onMouseLeave={() => setHover("none")}
					>
						<h3>{i18n.t("urlBar")}</h3>
					</div>
					<div
						onMouseEnter={() => setHover("toolbar")}
						onMouseLeave={() => setHover("none")}
					>
						<h3>{i18n.t("toolbar")}</h3>
					</div>
					<div
						onMouseEnter={() => setHover("sidebar")}
						onMouseLeave={() => setHover("none")}
					>
						<h3>{i18n.t("sidebar")}</h3>
					</div>
				</div>
			</div>
		</section>
	);
}
