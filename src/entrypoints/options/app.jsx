import { useState, useEffect } from "react";
import preference from "@/utils/preference";
import Toggle from "@/components/Toggle/Toggle";
import AdvancedSettingsTab from "./AdvancedSettingsTab/AdvancedSettingsTab";
import RuleListTab from "./RuleListTab/RuleListTab";
import ThemeBuilderTab from "./ThemeBuilderTab/ThemeBuilderTab";

const pref = new preference();

export default function App() {
	const [activeTab, setActiveTab] = useState(0);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		pref.initialise().then(() => setReady(true));
	}, []);

	return (
		<>
			<nav>
				<Toggle
					isTabToggle
					itemList={[
						i18n.t("themeBuilder"),
						i18n.t("ruleList"),
						i18n.t("advanced"),
					]}
					onChange={setActiveTab}
					activeIndex={activeTab}
				/>
			</nav>
			<hr />
			{(() => {
				switch (activeTab) {
					case 0:
						return <ThemeBuilderTab pref={pref} ready={ready} />;
					case 1:
						return <RuleListTab pref={pref} ready={ready} />;
					case 2:
						return (
							<AdvancedSettingsTab pref={pref} ready={ready} />
						);
					default:
						return null;
				}
			})()}
			<hr />
			<footer>
				<a
					href="https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues"
					target="_blank"
					rel="noopener noreferrer"
				>
					{i18n.t("reportAnIssue")}
				</a>
			</footer>
		</>
	);
}
