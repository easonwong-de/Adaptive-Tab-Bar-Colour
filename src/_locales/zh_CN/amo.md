**主要功能**

当您浏览网页时，这个插件将会动态更新 Firefox 背景色，使浏览器主题与正在浏览的网页融为一体——正如 macOS Safari 修改其标签栏颜色一样。

**与本插件兼容的插件有：**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**与本插件不兼容的有：**

- 低于 [Version 112.0](https://www.mozilla.org/firefox/112.0/releasenotes/) 版本的 Firefox（于 2023 年四月发布）
- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- 以及任何改变 Firefox 主题的扩展插件

**如果您想要移除工具栏下方的阴影：**

要移除网页内容在浏览器工具栏下方投射的细微阴影，请前往设置 (`about:preferences`) 并在「浏览器布局」部分关闭「显示侧栏」。或者，您也可以使用 CSS 主题。如需更多信息，请参阅 [GitHub issue #155](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/155)。

**如果您想要开启平滑颜色过渡：**

由于技术限制，标签栏的平滑颜色过渡无法原生支持。不过，您可以使用 CSS 主题来实现此效果。如需更多信息，请参阅 [GitHub issue #43](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour/issues/43)。

**如果您使用 CSS 主题：**

如果一个 CSS 主题使用默认的颜色参数，则其可以与 变色标签栏 兼容。比如，[这](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme)是一个与 变色标签栏 兼容的的 CSS 主题。

**如果您使用的是 Linux 的 GTK 主题：**

Firefox 的标题栏按钮可能会被重置为 Windows 风格。为了避免这种情况，请打开高级首选项（`about:config`），并将 `widget.gtk.non-native-titlebar-buttons.enabled` 设置为 `false`。（感谢 [@anselstetter](https://github.com/anselstetter/)）

**安全提示：**

小心带有恶意的网页界面：请注意区分浏览器页面和网页界面。如需更多信息，请参阅 [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/)。（感谢 [u/KazaHesto](https://www.reddit.com/user/KazaHesto/)）

欢迎您为 GitHub 仓库点亮 star：[https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
