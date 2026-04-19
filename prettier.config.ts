import { type Config } from "prettier";

const config: Config = {
	endOfLine: "lf",
	importOrder: [
		"<BUILTIN_MODULES>",
		"<THIRD_PARTY_MODULES>",
		"^@/utils/(.*)$",
		"^@/(.*)$",
		"^[./](?!.*\\.css$)",
		"^[./]",
	],
	importOrderSortSpecifiers: true,
	objectWrap: "collapse",
	plugins: [
		"@trivago/prettier-plugin-sort-imports",
		"prettier-plugin-css-order",
		"prettier-plugin-jsdoc",
		"prettier-plugin-sort-json",
		"prettier-plugin-yaml",
	],
	printWidth: 80,
	tabWidth: 4,
	useTabs: true,
	yamlBlockStyle: "folded",
	yamlQuoteKeys: false,
	yamlQuoteValues: true,
};

export default config;
