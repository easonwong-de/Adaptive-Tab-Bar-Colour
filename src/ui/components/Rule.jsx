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
			<Header
				rule={rule}
				onChange={(newHeader) => {
					const newRule = { ...rule, header: newHeader };
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
				className="delete-button"
				onClick={() => {
					setRule(null);
					onChange(null);
				}}
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M10 11.5V16.5M14 11.5V16.5M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
						stroke="currentColor"
					/>
				</svg>
			</button>
		</section>
	);
}

function Header({ rule, onChange }) {
	switch (rule.headerType) {
		case "URL":
			return (
				<div
					className={`header ${rule.header === "" ? "warning" : ""}`}
				>
					<input
						type="text"
						placeholder={i18n("urlDomainOrRegex")}
						title={i18n("urlDomainOrRegex")}
						value={rule.header}
						onChange={(e) => onChange(e.target.value)}
					/>
					<div title={i18n("thisPolicyWillBeIgnored")}>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M11.9998 8.99999V13M11.9998 17H12.0098M10.6151 3.89171L2.39019 18.0983C1.93398 18.8863 1.70588 19.2803 1.73959 19.6037C1.769 19.8857 1.91677 20.142 2.14613 20.3088C2.40908 20.5 2.86435 20.5 3.77487 20.5H20.2246C21.1352 20.5 21.5904 20.5 21.8534 20.3088C22.0827 20.142 22.2305 19.8857 22.2599 19.6037C22.2936 19.2803 22.0655 18.8863 21.6093 18.0983L13.3844 3.89171C12.9299 3.10654 12.7026 2.71396 12.4061 2.58211C12.1474 2.4671 11.8521 2.4671 11.5935 2.58211C11.2969 2.71396 11.0696 3.10655 10.6151 3.89171Z"
								stroke="currentColor"
							/>
						</svg>
					</div>
				</div>
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
					placeholder={i18n("querySelector")}
					title={i18n("querySelector")}
					value={rule.value}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
	}
}
