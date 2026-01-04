import { useState } from "react";
import { i18n } from "../utility";
import Switch from "./components/Switch";
import Glyph from "./components/Glyph";
import Slider from "./components/Slider";

export default function OptionsApp() {
	const [activeTab, setActiveTab] = useState(0);
	return (
		<>
			<nav>
				<Switch
					className="tab-switch"
					itemList={[
						i18n("themeBuilder"),
						i18n("siteList"),
						i18n("advanced"),
					]}
					onSelect={setActiveTab}
				/>
			</nav>
			<hr />
			<Main activeTab={activeTab} />
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

function Main({ activeTab }) {
	switch (activeTab) {
		case 0:
			return (
				<main id="tab-0">
					<div className="column">
						<section>
							<Glyph highlight="tab" />
							<div>
								<h3>{i18n("selectedTab")}</h3>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
								<Slider
									title={i18n("border")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
							</div>
						</section>
						<section>
							<Glyph highlight="toolbar" />
							<div>
								<h3>{i18n("toolbar")}</h3>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
							</div>
						</section>
						<section>
							<Glyph highlight="sidebar" />
							<div>
								<h3>{i18n("Sidebar")}</h3>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
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
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
								<Slider
									title={i18n("backgroundOnFocus")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
							</div>
						</section>
						<section>
							<Glyph highlight="tab-bar" />
							<div>
								<h3>{i18n("tabBar")}</h3>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
							</div>
						</section>
						<section>
							<Glyph highlight="popup" />
							<div>
								<h3>{i18n("Popup")}</h3>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
								<Slider
									title={i18n("background")}
									icon={""}
									minValue={-50}
									maxValue={50}
									minorStep={1}
									majorStep={5}
									initialValue={0}
									onChange={() => {}}
								/>
							</div>
						</section>
					</div>
				</main>
			);
		case 1:
			return <main id="tab-1"></main>;
		case 2:
			return <main id="tab-2"></main>;
	}
}
