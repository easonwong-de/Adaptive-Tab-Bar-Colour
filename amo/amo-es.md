**¿Qué Hace El Complemento?**

Este complemento ajusta dinámicamente el tema de Firefox para que coincida con la apariencia del sitio web que estás viendo, similar a la función de teñido de la barra de pestañas en Safari en macOS.

**Funciona Bien Con**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Incompatible Con**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Cualquier otro complemento que modifique el tema de Firefox

**Eliminar la Sombra en la Parte Inferior de la Barra de Herramientas**

Para eliminar la sombra fina proyectada por el contenido web sobre la barra de herramientas del navegador, ve a Ajustes (`about:preferences`) y desactiva «Mostrar barra lateral» en la sección «Disposición del navegador». Alternativamente, añade el siguiente código a tu tema CSS:

> `#tabbrowser-tabbox {`

> > `box-shadow: none !important;`

> `}`

**Activar Transiciones Suaves de Color**

Debido a limitaciones técnicas, las transiciones suaves de color para la barra de pestañas no están soportadas nativamente. Sin embargo, puedes activar este efecto añadiendo el siguiente código a tu tema CSS (gracias a [@Moarram](https://github.com/Moarram/)):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar {`

> > `transition:`

> > > `background-color 0.5s cubic-bezier(0, 0, 0, 1), border-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

Para activar transiciones suaves de color en la interfaz de Sidebery, añade el siguiente código al Editor de Estilos de Sidebery (gracias a [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**Compatibilidad con Temas CSS de Terceros**

Un tema CSS de terceros funciona con Adaptive Tab Bar Colour (ATBC), siempre que utilicen las variables de color estándar de Firefox (por ejemplo, `--lwt-accent-color` para el color de la barra de pestañas). [Este](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) es un ejemplo de un tema CSS compatible con ATBC.

**Botones de la Barra de Título en Linux con un Tema GTK**

Los botones de la barra de título de Firefox pueden volver al estilo de Windows. Para evitar esto, abre las «Preferencias avanzadas» (`about:config`) y establece `widget.gtk.non-native-titlebar-buttons.enabled` en `false`. (Gracias a [@anselstetter](https://github.com/anselstetter/))

**Advertencia De Seguridad**

Cuidado con las interfaces web maliciosas. Es importante distinguir entre la interfaz del navegador y la interfaz web. Para más información, consulta [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Gracias a [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Siéntete libre de dar una estrella a este proyecto en GitHub: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
