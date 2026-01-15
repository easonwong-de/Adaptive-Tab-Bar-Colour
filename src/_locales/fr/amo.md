**Que fait cette extension ?**

Cette extension ajuste dynamiquement le thème de Firefox pour correspondre à l’apparence du site web que vous consultez, de manière similaire à la fonction de teinte de la barre d’onglets dans Safari sur macOS.

**Compatible avec**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Incompatible avec**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Toute autre extension qui modifie le thème Firefox

**Supprimer l’ombre au bas de la barre d’outils**

Pour supprimer la fine ombre projetée par le contenu web sur la barre d’outils du navigateur, allez dans Paramètres (`about:preferences`) et désactivez « Afficher le panneau latéral » dans la section « Disposition du navigateur ». Alternativement, ajoutez le code suivant à votre thème CSS :

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Activer les transitions douces des couleurs**

En raison de limitations techniques, les transitions douces des couleurs pour la barre d’onglets ne sont pas prises en charge nativement. Cependant, vous pouvez activer cet effet en ajoutant le code suivant à votre thème CSS (merci à [@Moarram](https://github.com/Moarram/)) :

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar {`

> > `transition:`

> > > `background-color 0.5s cubic-bezier(0, 0, 0, 1), border-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

Pour activer les transitions douces des couleurs dans l’interface de Sidebery, ajoutez le code suivant à l’éditeur de style de Sidebery (merci à [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)) :

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**Compatibilité avec les thèmes CSS tiers**

Un thème CSS tiers fonctionne avec Adaptive Tab Bar Colour (ATBC), à condition qu’ils utilisent les variables de couleur standard de Firefox (par exemple, `--lwt-accent-color` pour la couleur de la barre d’onglets). [Ceci](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) est un exemple de thème CSS compatible avec ATBC.

**Boutons de la barre de titre sur Linux avec un thème GTK**

Les boutons de la barre de titre de Firefox peuvent revenir au style de Windows. Pour éviter cela, ouvrez les « Préférences avancées » (`about:config`) et définissez `widget.gtk.non-native-titlebar-buttons.enabled` sur `false`. (Merci à [@anselstetter](https://github.com/anselstetter/))

**Rappel de sécurité**

Attention aux interfaces web malveillantes. Il est important de faire la distinction entre l’interface du navigateur et l’interface web. Pour plus d’informations, veuillez consulter [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Merci à [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

N'hésitez pas à ajouter ce projet à vos favoris sur GitHub : [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
