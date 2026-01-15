**Was macht die Erweiterung?**

Diese Erweiterung passt das Theme von Firefox dynamisch an das Erscheinungsbild der von dir besuchten Website an, ähnlich wie die Tab-Leisten-Einfärbung in Safari auf macOS.

**Funktioniert gut mit**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Inkompatibel mit**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Jede andere Erweiterung, die das Firefox-Theme ändert

**Entfernen des Schattens am unteren Rand der Werkzeugleiste**

Um den dünnen Schatten zu entfernen, den der Webinhalt auf die Browser-Werkzeugleiste wirft, gehe zu Einstellungen (`about:preferences`) und deaktiviere „Sidebar anzeigen“ im Abschnitt „Browser-Layout“. Alternativ kannst du den folgenden Code zu deinem CSS-Theme hinzufügen:

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Aktivieren sanfter Farbübergänge**

Aufgrund technischer Einschränkungen werden sanfte Farbübergänge der Tableiste nicht nativ unterstützt. Du kannst jedoch diesen Effekt aktivieren, indem du den folgenden Code zu deinem CSS-Theme hinzufügst (dank an [@Moarram](https://github.com/Moarram/)):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar {`

> > `transition:`

> > > `background-color 0.5s cubic-bezier(0, 0, 0, 1), border-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

Um sanfte Farbübergänge in der Sidebery-Benutzeroberfläche zu aktivieren, füge den folgenden Code zum Sidebery Style Editor hinzu (dank an [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**Kompatibilität mit Drittanbieter-CSS-Themes**

Ein Drittanbieter-CSS-Theme funktioniert mit Anpassender Tableistenfarbe (ATBC), solange sie Firefoxs Standard-Farbvariablen verwenden (z. B. `--lwt-accent-color` für die Farbe der Tableiste). [Hier](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) ist ein Beispiel für ein ATBC-kompatibles CSS-Theme.

**Titelleisten-Schaltflächen unter Linux mit GTK-Theme**

Die Titelleisten-Schaltflächen von Firefox könnten auf den Windows-Stil zurückgesetzt werden. Um dies zu verhindern, öffne die „Erweiterten Einstellungen“ (`about:config`) und setze `widget.gtk.non-native-titlebar-buttons.enabled` auf `false`. (Dank an [@anselstetter](https://github.com/anselstetter/))

**Sicherheitserinnerung**

Achte auf bösartige Web-UIs. Es ist wichtig, zwischen der Browser-Benutzeroberfläche und der Web-Benutzeroberfläche zu unterscheiden. Für weitere Informationen siehe [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Dank an [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Gib diesem Projekt gerne einen Stern auf GitHub: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
