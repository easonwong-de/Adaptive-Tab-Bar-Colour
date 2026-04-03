import { useState, useEffect } from "react";
import clsx from "clsx";
import { getAddonName } from "../../utils/utility";
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

export default function Rule({ rule, inPopup = false, onChange }) {
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
					const newType = e.target.value;
					onChange({
						...rule,
						type: newType,
						value: defaultValue[newType],
					});
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
