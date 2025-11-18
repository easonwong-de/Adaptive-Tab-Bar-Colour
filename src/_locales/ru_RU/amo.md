**Что делает это дополнение?**

Пока вы просматриваете веб-страницы, это расширение меняет тему Firefox в соответствии с внешним видом сайта, который вы открыли — так же, как Safari в macOS перекрашивает панель вкладок.

**Отлично работает вместе с:**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Несовместимо с:**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- и любыми другими дополнениями, которые меняют тему Firefox

**Если вы хотите убрать тень под панелью инструментов:**

Чтобы удалить тонкую тень, отбрасываемую веб-контентом под панелью инструментов браузера, перейдите в Настройки (`about:preferences`) и отключите `Показать боковую панель` в разделе `Внешний вид браузера`. Альтернативно, вы можете использовать CSS-тему. Для получения дополнительной информации см. [GitHub issue #155](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/155).

**Если вы хотите включить плавный переход цвета:**

Из-за технических ограничений плавный переход цвета панели вкладок не поддерживается изначально. Однако вы можете использовать CSS-тему для достижения этого эффекта. Для получения дополнительной информации см. [GitHub issue #43](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/43).

**Если вы используете CSS-тему:**

CSS-тема может работать с ATBC (Adaptive Tab Bar Colour), если применяются системные цветовые переменные (например `--lwt-accent-color` для цвета панели вкладок). [Вот пример](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) CSS-темы, совместимой с ATBC.

**Если вы используете Linux с GTK темой:**

Кнопки заголовка Firefox могут вернуться к стилю Windows. Чтобы этого избежать, откройте расширенные настройки (`about:config`) и установите параметр `widget.gtk.non-native-titlebar-buttons.enabled` в значение `false`. (Спасибо [@anselstetter](https://github.com/anselstetter/))

**Напоминание о безопасности:**

Остерегайтесь вредоносных веб-интерфейсов: пожалуйста, различайте интерфейс браузера и интерфейс веб-сайта. Для получения дополнительной информации см. [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Спасибо [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Не забудьте отметить проект звездочкой на GitHub: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
