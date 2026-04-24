import { useEffect, useState } from "react";
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

	return (
		<>
			<div
				className="background"
				style={{
					backgroundColor: cache?.theme?.popupColour ?? "transparent",
				}}
			/>
			{ready && cache ? (
				<>
					<RuleWidget
						pref={pref}
						rule={cache.rule}
						meta={cache.meta}
					/>
					{cache.theme.corrected && <CorrectionWidget />}
				</>
			) : (
				<LoadingWidget />
			)}
			<button onClick={() => browser.runtime.openOptionsPage()}>
				{i18n.t("moreSettings")}
			</button>
		</>
	);
}
