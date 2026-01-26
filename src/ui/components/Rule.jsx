import { useEffect, useState } from "react";
import { i18n } from "../../utility";
import Switch from "./Switch";
import Colour from "./Colour";

const defaultValue = {
	COLOUR: "#000000",
	THEME_COLOUR: true,
	QUERY_SELECTOR: "",
};

export default function Rule({ initialRule, onChange = () => {} }) {
	const [rule, setRule] = useState(initialRule);
	useEffect(() => setRule(initialRule), [initialRule]);
	if (!initialRule || !rule) return null;

	return (
		<section headerType={rule.headerType}>
			<input
				type="text"
				value={rule.header}
				onChange={(e) => {
					const newRule = { ...rule, header: e.target.value };
					setRule(newRule);
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
					setRule(newRule);
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
					setRule(newRule);
					onChange(newRule);
				}}
			/>
			<button
				onClick={() => {
					setRule(null);
					onChange(null);
				}}
			>
				D
			</button>
		</section>
	);
}

function Select({ rule, onChange }) {
	switch (rule.headerType) {
		case "URL":
			return (
				<select
					value={rule.type}
					onChange={(e) => onChange(e.target.value)}
				>
					<option value="COLOUR">{i18n("specifyAColour")}</option>
					<option value="THEME_COLOUR">
						{i18n("useIgnoreThemeColour")}
					</option>
					<option value="QUERY_SELECTOR">
						{i18n("pickColourFromElement")}
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
			return <Colour initialColour={rule.value} onChange={onChange} />;
		case "THEME_COLOUR":
			return (
				<Switch
					itemList={[i18n("use"), i18n("ignore")]}
					initialActiveIndex={rule.value ? 0 : 1}
					onChange={(newIndex) => newIndex === 0}
				/>
			);
		case "QUERY_SELECTOR":
			return (
				<input
					type="text"
					value={rule.value}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
	}
}
