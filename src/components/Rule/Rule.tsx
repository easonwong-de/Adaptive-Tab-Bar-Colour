import clsx from "clsx";
import Icon from "../Icon/Icon";
import Text from "../Text/Text";
import Colour from "../Colour/Colour";
import Toggle from "../Toggle/Toggle";
import styles from "./rule.module.css";
import { useState, useEffect } from "react";
import { getAddonName } from "../../utils/utility";
import type { Rule as RuleData } from "../../utils/types.js";

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
					switch (e.target.value) {
						case "COLOUR":
							onChange({
								...rule,
								type: "COLOUR",
								value: defaultValue.COLOUR,
							});
							break;
						case "THEME_COLOUR":
							onChange({
								...rule,
								headerType: "URL",
								type: "THEME_COLOUR",
								value: defaultValue.THEME_COLOUR,
							});
						default:
							onChange({
								...rule,
								headerType: "URL",
								type: "QUERY_SELECTOR",
								value: defaultValue.QUERY_SELECTOR,
							});
							break;
					}
				}}
			>
				<option value="COLOUR">{i18n.t("specifyAColour")}</option>
				{rule.headerType === "URL" ? (
					<>
						<option value="THEME_COLOUR">
							{i18n.t("useIgnoreThemeColour")}
						</option>
						<option value="QUERY_SELECTOR">
							{i18n.t("pickColourFromElement")}
						</option>
					</>
				) : (
					<>
						<option disabled>
							{i18n.t("useIgnoreThemeColour")}
						</option>
						<option disabled>
							{i18n.t("pickColourFromElement")}
						</option>
					</>
				)}
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
