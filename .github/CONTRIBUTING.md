# Contributing

Thank you for your interest in contributing to Adaptive Tab Bar Colour!

## Sponsor

One way to contribute to the project is through sponsorship via:

<a href="https://www.paypal.com/donate?hosted_button_id=T5GL8WC7SVLLC" target="_blank">
	<img
		src="https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif"
		alt="Donate with PayPal button"
		style="height: 30px !important; width: auto !important"
	/>
</a>
<a href="https://www.buymeacoffee.com/easonwong" target="_blank">
	<img
		src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
		alt="Buy Me A Coffee"
		style="height: 30px !important; width: auto !important"
	/>
</a>

## Translation

To rectify translation errors or add a new locale, please update the following files:

- `src/_locales/xx/messages.json`: The text in the add-on’s popup and options page.
- `amo/amo-xx.md`: The add-on description on the Mozilla Add-on store and the “Details” section in Firefox’s Add-ons Manager.

## Development

Ensure the following software is installed in the development environment:

- [Node.js](https://nodejs.org/)
- [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/)

To begin contributing, run the following commands:

```bash
git clone https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour.git
cd Adaptive-Tab-Bar-Colour
npm install
```

To test the changes, run `npm start`, which:

1. Synchronises the add-on version from `package.json` to `src/manifest.json` and `src/constants.js`.
1. Formats source code using Prettier.
1. Launches the add-on in Firefox Developer Edition.
