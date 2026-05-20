![Icon](public/icon/icon-128.png)  
[![Mozilla Add-on Users](https://img.shields.io/amo/users/adaptive-tab-bar-colour)](https://addons.mozilla.org/firefox/addon/adaptive-tab-bar-colour/)
[![Mozilla Add-on Rating](https://img.shields.io/amo/stars/adaptive-tab-bar-colour)](https://addons.mozilla.org/firefox/addon/adaptive-tab-bar-colour/)
[![Mozilla Add-on](https://img.shields.io/amo/v/adaptive-tab-bar-colour?color=violet&label=version)](https://addons.mozilla.org/firefox/addon/adaptive-tab-bar-colour/)
[![Sponsors](https://img.shields.io/badge/sponsors-28-gold)](https://www.buymeacoffee.com/easonwong/)
[![WXT](https://img.shields.io/badge/WXT-67D55E?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTM1NC40MzUgNDE4LjE0MUMzODMuMjE3IDQxOC4xNDEgNDA2LjU1IDM5NC44MDggNDA2LjU1IDM2Ni4wMjZWMzEzLjkxSDQxNi4wMjZDNDQ0LjgwOCAzMTMuOTEgNDY4LjE0MSAyOTAuNTc4IDQ2OC4xNDEgMjYxLjc5NUM0NjguMTQxIDIzMy4wMTMgNDQ0LjgwOCAyMDkuNjggNDE2LjAyNiAyMDkuNjhINDA2LjU1VjE1Ny41NjVDNDA2LjU1IDEyOC43ODMgMzgzLjIxNyAxMDUuNDUgMzU0LjQzNSAxMDUuNDVIMzAyLjMyVjk1Ljk3NDVDMzAyLjMyIDY3LjE5MjEgMjc4Ljk4NyA0My44NTk0IDI1MC4yMDUgNDMuODU5NEMyMjEuNDIyIDQzLjg1OTQgMTk4LjA5IDY3LjE5MjEgMTk4LjA5IDk1Ljk3NDVWMTA1LjQ1SDE0NS45NzRDMTE3LjE5MiAxMDUuNDUgOTMuODU5NCAxMjguNzgzIDkzLjg1OTQgMTU3LjU2NVYyMDkuNjhIMTAzLjMzNUMxMzIuMTE3IDIwOS42OCAxNTUuNDUgMjMzLjAxMyAxNTUuNDUgMjYxLjc5NUMxNTUuNDUgMjkwLjU3OCAxMzIuMTE3IDMxMy45MSAxMDMuMzM1IDMxMy45MUg5My44NTk0VjQxOC4xNDFIMTk4LjA5VjQwOC42NjVDMTk4LjA5IDM3OS44ODMgMjIxLjQyMiAzNTYuNTUgMjUwLjIwNSAzNTYuNTVDMjc4Ljk4NyAzNTYuNTUgMzAyLjMyIDM3OS44ODMgMzAyLjMyIDQwOC42NjVWNDE4LjE0MUgzNTQuNDM1WiIgc3Ryb2tlPSIjNjdENTVFIiBzdHJva2Utd2lkdGg9IjQwIi8+PC9zdmc+&labelColor=grey&color=%2367D55E)](https://wxt.dev/)

# Adaptive Tab Bar Colour

Changes the colour of Firefox theme to match the website’s appearance.

<a href="https://addons.mozilla.org/firefox/addon/adaptive-tab-bar-colour/" target="_blank">
	<img src="https://easonwong.de/downloads/get-addon-badge-firefox.png" width="178" height="48">
</a>

<br>

## What Does the Add-on Do?

This add-on dynamically adjusts the Firefox theme to match the appearance of the website you are viewing, similar to the tab bar tinting feature in Safari on macOS.

<img src="https://addons.mozilla.org/user-media/previews/full/272/272045.png" width="45%"> <img src="https://addons.mozilla.org/user-media/previews/full/272/272046.png" width="45%"> <img src="https://addons.mozilla.org/user-media/previews/full/272/272047.png" width="45%"> <img src="https://addons.mozilla.org/user-media/previews/full/272/272048.png" width="45%">

<br>

## Works Well With

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

<br>

## Incompatible With

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Any other add-on that modifies the Firefox theme

<br>

## Removing the Shadow at the Bottom of the Toolbar

To remove the thin shadow cast by web content onto the browser toolbar, navigate to Settings (`about:preferences`) and disable “Show sidebar” in the “Browser Layout” section. Alternatively, add the following code to your CSS theme:

```css
#tabbrowser-tabbox, .browserContainer {
	box-shadow: none !important;
}
```

<details>
<summary>How to apply custom CSS</summary>

1. Type `about:config` in the address bar and press Enter.
2. Search for `toolkit.legacyUserProfileCustomizations.stylesheets` and set it to `true`.
3. Type `about:support` in the address bar.
4. Find “Profile Folder” and click the “Show in Finder” (macOS) or “Open Folder” (Windows/Linux) button.
5. Create a new folder named `chrome` in your profile directory.
6. Inside the `chrome` folder, create a text file named `userChrome.css`.
7. Paste the code above into `userChrome.css` and save the file.
8. Restart Firefox.

</details>

<br>

## Customising Colour Transitions

Due to technical limitations, smooth colour transitions for the tab bar are not natively supported. However, you can enable this effect by adding the following code to your CSS theme (thanks to [@Moarram](https://github.com/Moarram/)):

```css
#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar {
	transition:
		background-color 0.5s cubic-bezier(0, 0, 0, 1),
		border-color 0.5s cubic-bezier(0, 0, 0, 1) !important;
}
```

To enable smooth colour transitions in the Sidebery UI, add the following code to the Sidebery Style Editor (thanks to [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

```css
.Sidebar, .bottom-space {
	transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;
}
```

Alternatively, if you wish to remove Firefox’s built-in colour transition on the toolbar for an instant colour change, add the following code to your CSS theme:

```css
:root {
	--ext-theme-background-transition: none !important;
}
```

<details>
<summary>How to apply custom CSS</summary>

1. Type `about:config` in the address bar and press Enter.
2. Search for `toolkit.legacyUserProfileCustomizations.stylesheets` and set it to `true`.
3. Type `about:support` in the address bar.
4. Find “Profile Folder” and click the “Show in Finder” (macOS) or “Open Folder” (Windows/Linux) button.
5. Create a new folder named `chrome` in your profile directory.
6. Inside the `chrome` folder, create a text file named `userChrome.css`.
7. Paste the code above into `userChrome.css` and save the file.
8. Restart Firefox.

</details>

<br>

## Compatibility with Third-Party CSS Themes

A third-party CSS theme works with Adaptive Tab Bar Colour (ATBC), as long as they use Firefox’s standard colour variables (e.g. `--lwt-accent-color` for the tab bar colour). [This](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) is an example of an ATBC-compatible CSS theme.

<br>

## Title Bar Buttons on Linux with GTK Theme

Firefox’s title bar buttons may revert to the Windows style. To prevent this, access “Advanced Preferences” (`about:config`) and set `widget.gtk.non-native-titlebar-buttons.enabled` to `false`. (Thanks to [@anselstetter](https://github.com/anselstetter/))

<br>

## Safety Reminder

Beware of malicious web UIs. It is important to distinguish between the browser UI and the web UI. For further information, please refer to [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Thanks to [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))
