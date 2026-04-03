import preference from "@/utils/preference";
import {
	addMessageListener,
	getCurrentWindowCache,
	removeMessageListener,
} from "@/utils/utility";
import CorrectionWidget from "./CorrectionWidget/CorrectionWidget";
import RuleWidget from "./RuleWidget/RuleWidget";

const pref = new preference();

export default function App() {
	const [ready, setReady] = useState(false);
	const [cache, setCache] = useState(null);

	const handleMessage = (message) => {
		if (message.header === "CACHE_UPDATED")
			getCurrentWindowCache().then(setCache);
	};

	useEffect(() => {
		pref.initialise().then(() => setReady(true));
		getCurrentWindowCache().then(setCache);
		addMessageListener(handleMessage);
		return () => removeMessageListener(handleMessage);
	}, []);

	if (ready && cache) {
		return (
			<>
				<div
					className="background"
					style={{
						backgroundColor: cache.theme.popup ?? "transparent",
					}}
				></div>
				<RuleWidget pref={pref} rule={cache.rule} meta={cache.meta} />
				{cache.theme.corrected && <CorrectionWidget />}
				<button onClick={() => browser.runtime.openOptionsPage()}>
					{i18n.t("moreSettings")}
				</button>
			</>
		);
	} else {
		return null;
	}
}
