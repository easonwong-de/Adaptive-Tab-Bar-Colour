**What Does the Add-on Do?**

While you browse the web, this add-on changes the theme of Firefox to match the appearance of the website you are viewing — just like how macOS Safari tints its tab bar.

**Works Well With:**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylish](https://addons.mozilla.org/firefox/addon/stylish/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Incompatible With:**

- Firefox versions older than [112.0](https://www.mozilla.org/firefox/112.0/releasenotes/) (released in April 2023)
- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- and any other add-on that changes the Firefox theme

**If You’re Using a CSS Theme:**

A CSS theme can work with ATBC (Adaptive Tab Bar Color) when system color variables are used (e.g. `--lwt-accent-color` for tab bar color). [This](https://github.com/easonwong-de/WhiteSurFirefoxThemeMacOS) is an example of an ATBC-compatible CSS theme.

**If You’re Using Linux with a GTK Theme:**

Firefox’s titlebar buttons may revert to the Windows style. To prevent this, open Advanced Preferences (`about:config`) and set `widget.gtk.non-native-titlebar-buttons.enabled` to `false`. (Thanks to [@anselstetter](https://github.com/anselstetter/))

**Safety Reminder:**

Beware of malicious web UIs: Please distinguish between the browser’s UI and the web UI. See [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Thanks to [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Feel free to star this project on GitHub: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)