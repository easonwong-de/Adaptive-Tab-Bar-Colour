**Que fait cette extension ?**

Lorsque vous naviguez sur le web, cette extension modifie le thème de Firefox pour l'adapter à l'apparence du site web que vous consultez, tout comme Safari sur macOS colore sa barre d'onglets.

**Compatible avec :**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Incompatible avec :**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- et tout autre extensions modifiant le thème Firefox

**Si vous souhaitez supprimer l'ombre sous la barre d'outils :**

Pour supprimer la fine ombre projetée par le contenu web sous la barre d'outils du navigateur, allez dans Paramètres (`about:preferences`) et désactivez `Afficher le panneau latéral` dans la section `Disposition du navigateur`. Alternativement, vous pouvez utiliser un thème CSS. Pour plus d'informations, consultez [GitHub issue #155](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/155).

**Si vous souhaitez activer la transition douce des couleurs :**

En raison de limitations techniques, la transition douce des couleurs de la barre d'onglets n'est pas prise en charge nativement. Cependant, vous pouvez utiliser un thème CSS pour obtenir cet effet. Pour plus d'informations, consultez [GitHub issue #43](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/43).

**Si vous utilisez un thème CSS :**

Un thème CSS peut fonctionner avec ATBC (Adaptative Tab Bar Colour) lorsque des variables de couleur système sont utilisées (par exemple, `--lwt-accent-color` pour la couleur de la barre d'onglets). [Ceci](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) est un exemple de thème CSS compatible avec ATBC.

**Si vous utilisez Linux avec un thème GTK :**

Les boutons de la barre de titre de Firefox peuvent revenir au style de Windows. Pour éviter cela, ouvrez les Préférences avancées (`about:config`) et définissez `widget.gtk.non-native-titlebar-buttons.enabled` sur `false`. (Merci à [@anselstetter](https://github.com/anselstetter/))

**Rappel de sécurité :**

Attention aux interfaces web malveillantes : Veuillez faire la distinction entre l'interface du navigateur et l'interface web. Pour plus d'informations, consultez [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Merci à [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

N'hésitez pas à ajouter ce projet à vos favoris sur GitHub : [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
