import CorrectionWidget from "./widgets/CorrectionWidget";
import RuleWidget from "./widgets/RuleWidget";

const pref = new preference();

async function getCache(): Promise<Cache | undefined> {
	return await sendMessageToBackground<Cache | undefined>({
		header: "CACHE_REQUEST",
	});
}

export default function App() {
	const [ready, setReady] = useState(false);
	const [cache, setCache] = useState<Cache | undefined>(undefined);

	function handleMessage(message: MessageForPopup): void {
		if (message.header === "CACHE_UPDATE") getCache().then(setCache);
	}

	useEffect(() => {
		pref.initialise().then(() => setReady(true));
		getCache().then(setCache);
		addMessageListener(handleMessage);
		return () => removeMessageListener(handleMessage);
	}, []);

	return (
		<>
			{cache ? (
				<>
					<div
						className="background"
						style={{ backgroundColor: cache.theme.popupColour }}
					/>
					{ready && (
						<RuleWidget
							pref={pref}
							rule={cache.rule}
							meta={cache.meta}
						/>
					)}
					{cache.theme.corrected && <CorrectionWidget />}
				</>
			) : null}
			<button onClick={() => browser.runtime.openOptionsPage()}>
				{i18n.t("moreSettings")}
			</button>
		</>
	);
}
