import clsx from "clsx";
import { useSyncExternalStore } from "react";
import type preference from "@/utils/preference";
import Rule from "@/components/Rule/Rule";
import styles from "./rule.list.module.css";

interface RuleListTabProps {
	pref: preference;
	ready: boolean;
}

export default function RuleListTab({ pref, ready }: RuleListTabProps) {
	useSyncExternalStore(
		(listener) => pref.setOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	const ruleList = Object.entries(pref.ruleList).filter(
		([_, rule]) => rule !== null,
	);

	return (
		<main className={clsx(styles.ruleListTab, !ready && "disabled")}>
			<div className={styles.ruleList}>
				{ruleList.map(([rawId, rule]) => {
					return (
						<Rule
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
