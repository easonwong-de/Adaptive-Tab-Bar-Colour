**¿Qué Hace El Complemento?**

Mientras navegas por la web, este complemento cambia el tema de Firefox para que coincida con la apariencia de la página web que estás viendo. Esto es similar a cómo Safari tiñe su barra de pestañas en macOS.

**Funciona Bien Con:**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Incompatible Con:**

- Firefox inferior a la [versión 112.0](https://www.mozilla.org/firefox/112.0/releasenotes/) (lanzada en abril de 2023)
- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- y cualquier otro complemento que modifique el tema de Firefox

**Si Quieres Eliminar la Sombra Debajo de la Barra de Herramientas:**

Para eliminar la sombra fina proyectada por el contenido web debajo de la barra de herramientas del navegador, ve a Ajustes (`about:preferences`) y desactiva `Mostrar barra lateral` en la sección `Disposición del navegador`. Alternativamente, puedes usar un tema CSS. Para más información, consulta [GitHub issue #155](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/155).

**Si Quieres Activar la Transición Suave de Color:**

Debido a limitaciones técnicas, la transición suave de color de la barra de pestañas no está soportada nativamente. Sin embargo, puedes usar un tema CSS para lograr este efecto. Para más información, consulta [GitHub issue #43](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/43).

**Si estás usando un tema CSS:**

Un tema CSS puede funcionar con ATBC (Adaptive Tab Bar Colour) cuando se utilizan variables de color del sistema (por ejemplo, `--lwt-accent-color` para el color de la barra de pestañas). [Este](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) es un ejemplo de un tema CSS compatible con ATBC.

**Si estás usando Linux con un tema GTK:**

Los botones de la barra de título de Firefox pueden volver al estilo de Windows. Para evitar esto, abre las Preferencias avanzadas (`about:config`) y establece `widget.gtk.non-native-titlebar-buttons.enabled` en `false`. (Gracias a [@anselstetter](https://github.com/anselstetter/))

**Advertencia De Seguridad:**

Cuidado con las interfaces web maliciosas: distinga entre la interfaz de usuario del navegador y la interfaz de usuario web. Para más información, consulta [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Gracias a [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Siéntete libre de dar una estrella a este proyecto en GitHub: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
