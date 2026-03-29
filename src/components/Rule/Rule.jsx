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

export default function Rule({ rule, onChange = () => {} }) {
	if (!rule) return null;

	return (
		<section className={styles.ruleSection}>
			<Header
				rule={rule}
				onChange={(newHeader) => {
					const newRule = { ...rule, header: newHeader };
					onChange(newRule);
				}}
			/>
			<Select
				rule={rule}
				onChange={(newType) => {
					const newRule = {
						...rule,
						type: newType,
						value: defaultValue[newType],
					};
					onChange(newRule);
				}}
			/>
			<Input
				rule={rule}
				onChange={(newValue) => {
					const newRule = {
						...rule,
						value: newValue,
					};
					onChange(newRule);
				}}
			/>
			<button
				className={styles.deleteButton}
				onClick={() => onChange(null)}
			>
				<Icon type="delete" />
			</button>
		</section>
	);
}

function Header({ rule, onChange }) {
	switch (rule.headerType) {
		case "URL":
			return (
				<Text
					value={rule.header}
					placeholder={i18n.t("urlDomainOrRegex")}
					warning={i18n.t("thisPolicyWillBeIgnored")}
					onChange={onChange}
				/>
			);
		case "ADDON_ID":
			return <div>{rule.header}</div>;
	}
}

function Select({ rule, onChange }) {
	switch (rule.headerType) {
		case "URL":
			return (
				<select
					value={rule.type}
					onChange={(e) => onChange(e.target.value)}
				>
					<option value="COLOUR">{i18n.t("specifyAColour")}</option>
					<option value="THEME_COLOUR">
						{i18n.t("useIgnoreThemeColour")}
					</option>
					<option value="QUERY_SELECTOR">
						{i18n.t("pickColourFromElement")}
					</option>
				</select>
			);
		case "ADDON_ID":
			return null;
	}
}

function Input({ rule, onChange }) {
	switch (rule.type) {
		case "COLOUR":
			return <Colour value={rule.value} onChange={onChange} />;
		case "THEME_COLOUR":
			return (
				<Toggle
					itemList={[i18n.t("use"), i18n.t("ignore")]}
					activeIndex={rule.value ? 0 : 1}
					onChange={(newIndex) => onChange(newIndex === 0)}
				/>
			);
		case "QUERY_SELECTOR":
			return (
				<Text
					value={rule.value}
					placeholder={i18n.t("querySelector")}
					onChange={onChange}
				/>
			);
	}
}
