import clsx from "clsx";
import styles from "./RuleCard.module.css";

const defaultValue = {
	COLOUR: "#000000",
	THEME_COLOUR: true,
	QUERY_SELECTOR: "",
};

interface RuleCardProps {
	rule: Rule;
	inPopup?: boolean;
	onChange: (newRule: Rule) => void;
}

export default function RuleCard({
	rule,
	inPopup = false,
	onChange,
}: RuleCardProps) {
	if (!rule) return null;

	const [webExtName, setWebExtName] = useState(rule?.header);

	useEffect(() => {
		if (rule?.headerType === "ADDON_ID")
			getWebExtName(rule.header).then((name) =>
				setWebExtName(name ?? i18n.t("addonNotFound")),
			);
	}, [rule?.header, rule?.headerType]);

	const selectedOptionTitle = (() => {
		switch (rule.type) {
			case "COLOUR":
				return i18n.t("specifyAColour");
			case "THEME_COLOUR":
				return i18n.t("useIgnoreThemeColour");
			case "QUERY_SELECTOR":
				return i18n.t("pickColourFromElement");
			default:
				return "";
		}
	})();

	return (
		<section className={clsx(styles.ruleCard, inPopup && styles.inPopup)}>
			{!inPopup &&
				(rule.headerType === "ADDON_ID" ? (
					<div className={styles.webExtHeader}>{webExtName}</div>
				) : (
					<Input
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
				title={selectedOptionTitle}
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
								inPopup={inPopup}
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
							<Input
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
