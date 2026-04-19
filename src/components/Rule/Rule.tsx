import clsx from "clsx";
import { useEffect, useState } from "react";
import type { Rule as RuleData } from "@/utils/types";
import { getWebExtName } from "@/utils/utility";
import Colour from "@/components/Colour/Colour";
import Icon from "@/components/Icon/Icon";
import Text from "@/components/Text/Text";
import Toggle from "@/components/Toggle/Toggle";
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

	const [webExtName, setWebExtName] = useState(rule?.header);

	useEffect(() => {
		if (rule?.headerType === "ADDON_ID")
			getWebExtName(rule.header).then((name) =>
				setWebExtName(name ?? i18n.t("addonNotFound")),
			);
	}, [rule?.header, rule?.headerType]);

	return (
		<section
			className={clsx(styles.ruleSection, inPopup && styles.inPopup)}
		>
			{!inPopup &&
				(rule.headerType === "ADDON_ID" ? (
					<div className={styles.webExtHeader}>{webExtName}</div>
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
							break;
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
			{(() => {
				switch (rule.type) {
					case "COLOUR":
						return (
							<Colour
								value={rule.value}
								onChange={(newValue) =>
									onChange({ ...rule, value: newValue })
								}
							/>
						);
					case "THEME_COLOUR":
						return (
							<Toggle
								itemList={[i18n.t("use"), i18n.t("ignore")]}
								activeIndex={rule.value ? 0 : 1}
								onChange={(newIndex) =>
									onChange({ ...rule, value: newIndex === 0 })
								}
							/>
						);
					case "QUERY_SELECTOR":
						return (
							<Text
								value={rule.value}
								placeholder={i18n.t("querySelector")}
								onChange={(newValue) =>
									onChange({ ...rule, value: newValue })
								}
							/>
						);
					default:
						return null;
				}
			})()}
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
