import { useEffect, useState, useSyncExternalStore } from "react";
import { i18n } from "../utility";
import Switch from "./components/Switch";
import Glyph from "./components/Glyph";
import Slider from "./components/Slider";
import Rule from "./components/Rule";
import preference from "../preference";

const pref = new preference();

export default function OptionsApp() {
	const [activeTab, setActiveTab] = useState(0);
	const [ready, setReady] = useState(false);
	useEffect(() => pref.initialise().then(() => setReady(true)), []);
	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	return (
		<>
			<nav>
				<Switch
					className="tab-switch"
					itemList={[
						i18n("themeBuilder"),
						i18n("ruleList"),
						i18n("advanced"),
					]}
					onChange={setActiveTab}
					initialActiveIndex={activeTab}
				/>
			</nav>
			<hr />
			<Main ready={ready} activeTab={activeTab} />
			<hr />
			<footer>
				<a
					href="https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues"
					target="_blank"
					rel="noopener noreferrer"
				>
					{i18n("reportAnIssue")}
				</a>
			</footer>
		</>
	);
}

function Main({ ready, activeTab }) {
	switch (activeTab) {
		case 0:
			return <ThemeBuilder ready={ready} />;
		case 1:
			return <RuleList ready={ready} />;
		case 2:
			return <Advanced ready={ready} />;
	}
}

function ThemeBuilder({ ready }) {
	return (
		<main id="tab-0" className={ready ? "" : "disabled"}>
			<div className="column">
				<section>
					<Glyph highlight="tab" />
					<div>
						<h3>{i18n("selectedTab")}</h3>
						<Slider
							title={i18n("background")}
							initialValue={pref.tabSelected}
							onChange={(value) => (pref.tabSelected = value)}
						/>
						<Slider
							title={i18n("border")}
							initialValue={pref.tabSelectedBorder}
							onChange={(value) =>
								(pref.tabSelectedBorder = value)
							}
						/>
					</div>
				</section>
				<section>
					<Glyph highlight="toolbar" />
					<div>
						<h3>{i18n("toolbar")}</h3>
						<Slider
							title={i18n("background")}
							initialValue={pref.toolbar}
							onChange={(value) => (pref.toolbar = value)}
						/>
						<Slider
							title={i18n("border")}
							initialValue={pref.toolbarBorder}
							onChange={(value) => {
								pref.toolbarBorder = value;
							}}
						/>
					</div>
				</section>
				<section>
					<Glyph highlight="sidebar" />
					<div>
						<h3>{i18n("Sidebar")}</h3>
						<Slider
							title={i18n("background")}
							initialValue={pref.sidebar}
							onChange={(value) => {
								pref.sidebar = value;
							}}
						/>
						<Slider
							title={i18n("border")}
							initialValue={pref.sidebarBorder}
							onChange={(value) => {
								pref.sidebarBorder = value;
							}}
						/>
					</div>
				</section>
			</div>
			<div className="column">
				<section>
					<Glyph highlight="url-bar" />
					<div>
						<h3>{i18n("URLBar")}</h3>
						<Slider
							title={i18n("background")}
							initialValue={pref.toolbarField}
							onChange={(value) => {
								pref.toolbarField = value;
							}}
						/>
						<Slider
							title={i18n("backgroundOnFocus")}
							initialValue={pref.toolbarFieldOnFocus}
							onChange={(value) => {
								pref.toolbarFieldOnFocus = value;
							}}
						/>
						<Slider
							title={i18n("border")}
							initialValue={pref.toolbarFieldBorder}
							onChange={(value) => {
								pref.toolbarFieldBorder = value;
							}}
						/>
					</div>
				</section>
				<section>
					<Glyph highlight="tab-bar" />
					<div>
						<h3>{i18n("tabBar")}</h3>
						<Slider
							title={i18n("background")}
							initialValue={pref.tabbar}
							onChange={(value) => {
								pref.tabbar = value;
							}}
						/>
						<Slider
							title={i18n("border")}
							initialValue={pref.tabbarBorder}
							onChange={(value) => {
								pref.tabbarBorder = value;
							}}
						/>
					</div>
				</section>
				<section>
					<Glyph highlight="popup" />
					<div>
						<h3>{i18n("Popup")}</h3>
						<Slider
							title={i18n("background")}
							initialValue={pref.popup}
							onChange={(value) => {
								pref.popup = value;
							}}
						/>
						<Slider
							title={i18n("border")}
							initialValue={pref.popupBorder}
							onChange={(value) => {
								pref.popupBorder = value;
							}}
						/>
					</div>
				</section>
			</div>
		</main>
	);
}

function RuleList({ ready }) {
	return (
		<main id="tab-1" className={ready ? "" : "disabled"}>
			{Object.keys(pref.ruleList).map((id) => {
				if (pref.ruleList[id])
					return (
						<Rule
							key={`rule${id}`}
							initialRule={pref.ruleList[id]}
							onChange={(newRule) => pref.setRule(id, newRule)}
						/>
					);
			})}
			<button
				id="add-rule"
				onClick={() => {
					pref.addRule({
						headerType: "URL",
						header: "",
						type: "COLOUR",
						value: "#000000",
					});
					pref.syncUI();
				}}
			>
				{i18n("addANewRule")}
			</button>
		</main>
	);
}

function Advanced({ ready }) {
	return <main id="tab-2" className={ready ? "" : "disabled"}></main>;
}
