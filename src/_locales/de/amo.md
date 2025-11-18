**Was macht die Erweiterung?**

Während du im Web surfst, ändert diese Erweiterung das Theme von Firefox, um es an das Erscheinungsbild der von dir besuchten Website anzupassen – ähnlich wie macOS Safari seine Tableiste einfärbt.

**Funktioniert gut mit:**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Inkompatibel mit:**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- und jede andere Erweiterung, die das Firefox-Theme ändert

**Falls du den Schatten auf der Werkzeugleiste entfernen möchtest:**

Um den dünnen Schatten zu entfernen, den die Webinhalt-Maske auf die Werkzeugleiste wirft, gehe zu Einstellungen (`about:preferences`) und deaktiviere `Sidebar anzeigen` unter dem Abschnitt `Browser-Layout`. Alternativ kannst du ein CSS-Theme verwenden. Für weitere Informationen siehe [GitHub issue #155](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/155).

**Falls du sanfte Farbübergänge aktivieren möchtest:**

Aufgrund technischer Einschränkungen werden sanfte Farbübergänge der Tableiste nicht nativ unterstützt. Du kannst jedoch ein CSS-Theme verwenden, um diesen Effekt zu erzielen. Für weitere Informationen siehe [GitHub issue #43](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/43).

**Falls du ein CSS-Theme verwendest:**

Ein CSS-Theme kann mit Anpassender Tableistenfarbe funktionieren, wenn Systemfarbvariablen verwendet werden (z. B. `--lwt-accent-color` für die Farbe der Tableiste). [Hier](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) ist ein Beispiel für ein kompatibles CSS-Theme.

**Falls du Linux mit einem GTK-Theme verwendest:**

Die Titelleisten-Schaltflächen von Firefox könnten auf den Windows-Stil zurückgesetzt werden. Um dies zu verhindern, öffne die Erweiterten Einstellungen (`about:config`) und setze `widget.gtk.non-native-titlebar-buttons.enabled` auf `false`. (Dank an [@anselstetter](https://github.com/anselstetter/))

**Sicherheitserinnerung:**

Achte auf bösartige Website-UIs: Unterscheide immer zwischen der Benutzeroberfläche des Browsers und der Benutzeroberfläche einer Website. Für weitere Informationen siehe [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Dank an [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Gib diesem Projekt gerne einen Stern auf GitHub: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
