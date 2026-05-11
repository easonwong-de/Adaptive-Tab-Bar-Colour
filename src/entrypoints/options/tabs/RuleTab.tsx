import preference from "@/utils/preference";
import clsx from "clsx";
import { useSyncExternalStore } from "react";
import styles from "./RuleTab.module.css";

interface RuleTabProps {
	pref: preference;
	ready: boolean;
}

export default function RuleTab({ pref, ready }: RuleTabProps) {
	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	const ruleList = Object.entries(pref.ruleList).filter(
		([_, rule]) => rule !== null,
	);

	return (
		<main className={clsx(styles.ruleTab, !ready && "disabled")}>
			<div className={styles.ruleList}>
				{ruleList.map(([rawId, rule]) => {
					return (
						<RuleCard
							key={`rule${rawId}`}
							rule={rule}
							onChange={(newRule) =>
								pref.setRule(Number(rawId), newRule)
							}
						/>
					);
				})}
			</div>
			<button
				className={clsx(
					styles.addRuleButton,
					ruleList.length > 0 && styles.marginTop,
				)}
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
				{i18n.t("addANewRule")}
			</button>
		</main>
	);
}
