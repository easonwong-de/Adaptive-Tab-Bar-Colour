const config = {
	printWidth: 80,
	useTabs: true,
	tabWidth: 4,
	plugins: [
		"prettier-plugin-css-order",
		"prettier-plugin-sort-json",
		"prettier-plugin-jsdoc",
		"prettier-plugin-yaml",
		"@trivago/prettier-plugin-sort-imports",
	],
	yamlQuoteKeys: false,
	yamlQuoteValues: true,
	yamlBlockStyle: "folded",
	importOrderSortByLength: "asc",
};

export default config;
