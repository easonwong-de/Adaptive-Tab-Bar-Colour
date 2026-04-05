import { useState, useEffect } from "react";
import clsx from "clsx";
import { getAddonName } from "../../utils/utility";
import type { Rule as RuleData, RuleType } from "../../utils/types.js";
import Colour from "../Colour/Colour";
import Icon from "../Icon/Icon";
import Text from "../Text/Text";
import Toggle from "../Toggle/Toggle";
import styles from "./rule.module.css";

const defaultValue = {
	COLOUR: "#000000",
	THEME_COLOUR: true,
	QUERY_SELECTOR: "",
};

interface RuleProps {
	rule: RuleData;
	inPopup?: boolean;
	onChange: (newRule: RuleData) => void;
}

export default function Rule({ rule, inPopup = false, onChange }: RuleProps) {
	if (!rule) return null;

	const [addonName, setAddonName] = useState(rule?.header);

	useEffect(() => {
		if (rule?.headerType === "ADDON_ID")
			getAddonName(rule.header).then(setAddonName);
	}, [rule?.header, rule?.headerType]);

	return (
		<section
			className={clsx(styles.ruleSection, inPopup && styles.inPopup)}
		>
			{!inPopup &&
				(rule.headerType === "ADDON_ID" ? (
					<div className={styles.addonHeader}>{addonName}</div>
				) : (
					<Text
						value={rule.header}
						placeholder={i18n.t("urlDomainOrRegex")}
						warning={i18n.t("thisPolicyWillBeIgnored")}
						onChange={(newHeader) =>
							onChange({ ...rule, header: newHeader })
						}
					/>
				))}
			<select
				value={rule.type}
				onChange={(e) => {
					const newType = e.target.value as RuleType;
					const urlHeaderType = "URL" as const;
					if (newType === "COLOUR") {
						onChange({
							...rule,
							type: "COLOUR",
							value: defaultValue.COLOUR,
						});
					} else if (newType === "THEME_COLOUR") {
						onChange({
							...rule,
							headerType: urlHeaderType,
							type: "THEME_COLOUR",
							value: defaultValue.THEME_COLOUR,
						});
					} else {
						onChange({
							...rule,
							headerType: urlHeaderType,
							type: "QUERY_SELECTOR",
							value: defaultValue.QUERY_SELECTOR,
						});
					}
				}}
			>
				<option value="COLOUR">{i18n.t("specifyAColour")}</option>
				<option
					value="THEME_COLOUR"
					disabled={rule.headerType === "ADDON_ID"}
				>
					{i18n.t("useIgnoreThemeColour")}
				</option>
				<option
					value="QUERY_SELECTOR"
					disabled={rule.headerType === "ADDON_ID"}
				>
					{i18n.t("pickColourFromElement")}
				</option>
			</select>
			{rule.type === "COLOUR" ? (
				<Colour
					value={rule.value}
					onChange={(newValue) =>
						onChange({ ...rule, value: newValue })
					}
				/>
			) : rule.type === "THEME_COLOUR" ? (
				<Toggle
					itemList={[i18n.t("use"), i18n.t("ignore")]}
					activeIndex={rule.value ? 0 : 1}
					onChange={(newIndex) =>
						onChange({ ...rule, value: newIndex === 0 })
					}
				/>
			) : rule.type === "QUERY_SELECTOR" ? (
				<Text
					value={rule.value}
					placeholder={i18n.t("querySelector")}
					onChange={(newValue) =>
						onChange({ ...rule, value: newValue })
					}
				/>
			) : null}
			{!inPopup && (
				<button
					className={styles.deleteButton}
					onClick={() => onChange(null)}
				>
					<Icon type="delete" />
				</button>
			)}
		</section>
	);
}
