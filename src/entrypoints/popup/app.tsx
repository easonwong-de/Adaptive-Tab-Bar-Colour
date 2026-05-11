import preference from "@/utils/preference";
import CorrectionWidget from "./widgets/CorrectionWidget";
import LoadingWidget from "./widgets/LoadingWidget";
import RuleWidget from "./widgets/RuleWidget";
import ThemeWidget from "./widgets/ThemeWidget";

const pref = new preference();

async function getCache(): Promise<CacheData | undefined> {
	return await sendMessageToBackground<CacheData | undefined>({
		header: "CACHE_REQUEST",
	});
}

export default function App() {
	const [ready, setReady] = useState(false);
	const [cache, setCache] = useState<CacheData | undefined>();

	function handleMessage(message: MessageForPopup): void {
		if (message.header === "CACHE_UPDATE") setCache(message.cache);
	}

	useEffect(() => {
		pref.initialise().then(() => setReady(true));
		getCache().then(setCache);
		addMessageListener(handleMessage);
		return () => removeMessageListener(handleMessage);
	}, []);

	useEffect(() => {
		document.documentElement.style.setProperty(
			"--app",
			cache?.themeData?.popupColour ?? "inherit",
		);
	}, [cache?.themeData?.popupColour]);

	return (
		<>
			{ready && cache ? (
				<>
					<RuleWidget
						pref={pref}
						ruleData={cache.ruleData}
						metaData={cache.metaData}
					/>
					{cache.themeData.corrected && <CorrectionWidget />}
				</>
			) : (
				<LoadingWidget />
			)}
			<ThemeWidget ready={ready} pref={pref} />
		</>
	);
}
