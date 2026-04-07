import { type Config } from "prettier";

const config: Config = {
	importOrderSortByLength: "asc",
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
