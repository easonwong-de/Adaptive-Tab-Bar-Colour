**主要功能**

此插件可动态调整 Firefox 主题，使之与您正在浏览的网站外观相匹配——正如 macOS Safari 的标签栏着色功能一样。

**与本插件兼容的插件有**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**与本插件不兼容的有**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- 任何修改 Firefox 主题的扩展插件

**移除工具栏下方的阴影**

要移除网页内容在浏览器工具栏上投射的细微阴影，请前往设置 (`about:preferences`) 并在“浏览器布局”部分关闭“显示侧栏”。或者，将以下代码添加到您的 CSS 主题：

> `#tabbrowser-tabbox {`

> > `box-shadow: none !important;`

> `}`

**启用平滑颜色过渡**

由于技术限制，标签栏的平滑颜色过渡无法原生支持。不过，您可以通过将以下代码添加到您的 CSS 主题来启用此效果（感谢 [@Moarram](https://github.com/Moarram/)）：

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar {`

> > `transition:`

> > > `background-color 0.5s cubic-bezier(0, 0, 0, 1), border-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

要在 Sidebery 界面中启用平滑颜色过渡，请将以下代码添加到 Sidebery 样式编辑器（感谢 [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)）：

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**与第三方 CSS 主题的兼容性**

第三方 CSS 主题可与变色标签栏 (ATBC) 兼容，只要它们使用 Firefox 的标准颜色变量（例如，`--lwt-accent-color` 用于标签栏颜色）。比如，[这](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme)是一个与 ATBC 兼容的 CSS 主题。

**Linux 搭配 GTK 主题时的标题栏按钮**

Firefox 的标题栏按钮可能会被重置为 Windows 风格。为了避免这种情况，请打开“高级首选项”（`about:config`），并将 `widget.gtk.non-native-titlebar-buttons.enabled` 设置为 `false`。（感谢 [@anselstetter](https://github.com/anselstetter/)）

**安全提示**

提防恶意网页界面。分辨浏览器界面与网页界面至关重要。如需更多信息，请参阅 [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/)。（感谢 [u/KazaHesto](https://www.reddit.com/user/KazaHesto/)）

欢迎您为 GitHub 仓库点亮 star：[https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
