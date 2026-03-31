import preference from "@/utils/preference";
import { getCurrentWindowCache } from "@/utils/utility";
import InfoDisplay from "./InfoDisplay/InfoDisplay";

const pref = new preference();

export default function App() {
	const [ready, setReady] = useState(false);
	const [cache, setCache] = useState(null);

	useEffect(() => {
		pref.initialise().then(() => setReady(true));
		getCurrentWindowCache().then(setCache);
	}, []);

	return (
		<>
			<div
				className="background"
				style={{
					backgroundColor: cache?.theme?.popup ?? "transparent",
				}}
			></div>
			<InfoDisplay cache={cache} />
			<button onClick={() => browser.runtime.openOptionsPage()}>
				{i18n.t("moreSettings")}
			</button>
		</>
	);
}
