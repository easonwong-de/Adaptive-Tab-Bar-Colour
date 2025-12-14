**主要功能**

此擴充套件可動態調整 Firefox 佈景主題，使之與閣下正在瀏覽的網站外觀相配——正如 macOS Safari 的標籤列着色功能一樣。

**和此套件運作無間的有**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**和此套件不相容的有**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- 任何修改 Firefox 佈景主題的擴充套件

**移除工具列下方的陰影**

要移除網頁內容在瀏覽器工具列上投射的細微陰影，請前往設定 (`about:preferences`) 並在「瀏覽器版面」部分關閉「顯示側邊欄」。另外，閣下亦可將以下程式碼加入閣下的 CSS 主題：

> `#tabbrowser-tabbox {`

> > `box-shadow: none !important;`

> `}`

**啟用平滑顏色過渡**

由於技術限制，標籤列的平滑顏色過渡無法原生支援。然而，閣下可以透過將以下程式碼加入閣下的 CSS 主題來啟用此效果（感謝 [@Moarram](https://github.com/Moarram/)）：

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar {`

> > `transition:`

> > > `background-color 0.5s cubic-bezier(0, 0, 0, 1), border-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

要在 Sidebery 介面中啟用平滑顏色過渡，請將以下程式碼加入 Sidebery 樣式編輯器（感謝 [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)）：

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**與第三方 CSS 主題的兼容性**

第三方 CSS 主題可與變色標題列 (ATBC) 相容，只要它們使用 Firefox 的標準顏色變數（例如，`--lwt-accent-color` 用於標題列顏色）。譬如，[這](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme)是一個與 ATBC 相容的 CSS 主題。

**Linux 配搭 GTK 主題時的標題列按鈕**

Firefox 的標題列按鈕或會重設為 Windows 風格。為免此發生，請開啟「進階偏好設定」（`about:config`），並將 `widget.gtk.non-native-titlebar-buttons.enabled` 設為 `false`。（感謝 [@anselstetter](https://github.com/anselstetter/)）

**安全提示**

提防惡意網頁介面。分辨瀏覽器介面與網頁介面至關重要。如需更多資訊，請參閱 [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/)。（感謝 [u/KazaHesto](https://www.reddit.com/user/KazaHesto/)）

閣下可移步 GitHub 為此專案加星標：[https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
