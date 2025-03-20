
**Was macht die Erweiterung?**

Während du im Web surfst, ändert diese Erweiterung das Theme von Firefox, um es an das Erscheinungsbild der von dir besuchten Website anzupassen – ähnlich wie macOS Safari seine Tableiste einfärbt.

**Funktioniert gut mit:**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylish](https://addons.mozilla.org/firefox/addon/stylish/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)
- [automaticDark](https://addons.mozilla.org/firefox/addon/automatic-dark/)

**Inkompatibel mit:**

- Firefox-Versionen älter als [112.0](https://www.mozilla.org/firefox/112.0/releasenotes/) (veröffentlicht im April 2023)
- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- und jede andere Erweiterung, die das Firefox-Theme ändert

**Falls du ein CSS-Theme verwendest:**

Ein CSS-Theme kann mit **Anpassende Tableistenfarbe** funktionieren, wenn Systemfarbvariablen verwendet werden (z. B. `--lwt-accent-color` für die Farbe der Tableiste). [Hier](https://github.com/easonwong-de/WhiteSurFirefoxThemeMacOS) ist ein Beispiel für ein kompatibles CSS-Theme.

**Falls du Linux mit einem GTK-Theme verwendest:**

Die Titelleisten-Schaltflächen von Firefox könnten auf den Windows-Stil zurückgesetzt werden. Um dies zu verhindern, öffne die erweiterten Einstellungen (`about:config`) und setze `widget.gtk.non-native-titlebar-buttons.enabled` auf `false`. (Dank an [@anselstetter](https://github.com/anselstetter/))

**Sicherheitswarnung:**

Achte auf bösartige Web-UIs: Unterscheide zwischen der Benutzeroberfläche des Browsers und der Benutzeroberfläche einer Website. Siehe [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Dank an [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Gib diesem Projekt gerne einen Stern auf GitHub: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)