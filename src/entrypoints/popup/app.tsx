import { CSSProperties, useEffect, useState } from "react";
import preference from "@/utils/preference";
import type { Cache, MessageForPopup } from "@/utils/types";
import {
	addMessageListener,
	removeMessageListener,
	sendMessageToBackground,
} from "@/utils/utility";
import CorrectionWidget from "./CorrectionWidget/CorrectionWidget";
import LoadingWidget from "./LoadingWidget/LoadingWidget";
import RuleWidget from "./RuleWidget/RuleWidget";
import ThemeWidget from "./ThemeWidget/ThemeWidget";

const pref = new preference();

async function getCache(): Promise<Cache | undefined> {
	return await sendMessageToBackground<Cache | undefined>({
		header: "CACHE_REQUEST",
	});
}

export default function App() {
	const [ready, setReady] = useState(false);
	const [cache, setCache] = useState<Cache | undefined>();

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
