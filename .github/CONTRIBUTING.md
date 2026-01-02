# Contributing

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/)

## Setup

```bash
git clone https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour.git
cd Adaptive-Tab-Bar-Colour
npm install
```

## Commands

### Development
Run `npm start` to execute `node build.js --watch`. This command:
1. Syncs the version from `package.json` to `src/manifest.json` and `src/constants.js`.
2. Formats source code using Prettier.
3. Builds the extension with Vite in watch mode.
4. Launches Firefox Developer Edition with the extension loaded.

### Production Build
Run `npm run build` to execute `node build.js`. This command:
1. Syncs the version from `package.json` to `src/manifest.json` and `src/constants.js`.
2. Formats source code using Prettier.
3. Builds the extension to `build/` and packages it to `dist/`.
4. Lints the output using `web-ext lint`.

## Translation

- `src/_locales/`: Contains `messages.json` files for extension UI translations.
- `amo/`: Contains Markdown files for Add-on store descriptions.

## Workflow

1. Fork the repository and create a feature branch (e.g. `feat/fr-locale`).
2. Make changes in the `src/` directory.
3. Verify changes using `npm start`.
4. Commit, push, and submit a Pull Request.
