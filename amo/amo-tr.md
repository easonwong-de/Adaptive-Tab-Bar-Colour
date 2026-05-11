**Bu Eklenti Ne İşe Yarar?**

Bu eklenti, Firefox temasını dinamik olarak görüntülediğiniz web sitesinin görünümüyle eşlemek için değiştirir. macOS'teki Safari'nin site rengini sekme çubuğunda gösterme özelliğine benzer.

**Beraber İyi Çalışan Eklentiler**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Uyumsuz Eklentiler**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Firefox temasını değiştiren herhangi bir diğer eklenti

**Araç Çubuğunun Altındaki Gölgeden Kurtulmak**

Web içeriği tarafından tarayıcı araç çubuğuna vuran ince gölgeyi kaldırmak için, Ayarlar'a (`about:preferences`) gidin ve “Tarayıcı Düzeni” bölümündeki “Kenar çubuğunu göster” ayarını kapatın. Dilerseniz bunun yerine aşağıdaki kodu CSS temanıza da ekleyebilirsiniz:

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Renk Geçişlerini Özelleştirme**

Teknik sınırlamalar sebebiyle sekme çubuğu için yumuşak renk geçişleri yerleşik olarak desteklenmiyor. Ancak aşağıdaki kodu CSS temanıza ekleyerek bu efekti devreye alabilirsiniz ([@Moarram](https://github.com/Moarram/)'a teşekkürler):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar {`

> > `transition:`

> > > `background-color 0.5s cubic-bezier(0, 0, 0, 1), border-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

Sidebery arayüzünde yumuşak renk geçişlerini devreye almak için aşağıdaki kodu Sidebery Style Editor'e ekleyin ([@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)'a teşekkürler):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

Bunun yerine, Firefox'un yerleşik renk geçişini kaldırıp rengin anında değişmesini isterseniz, aşağıdaki kodu CSS temanıza ekleyin:

> `:root {`

> > `--ext-theme-background-transition: none !important;`

> `}`

**Üçüncü Taraf CSS Temalarıyla Uyumluluk**

Firefox'un standart renk değişkenlerini (örneğin sekme çubuğu rengi için `--lwt-accent-color`) kullandığı sürece üçüncü taraf bir CSS teması Adaptive Tab Bar Colour (ATBC) ile beraber çalışır. [Burada](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) ATBC ile uyumlu bir CSS temasının örneğini bulabilirsiniz.

**GTK Temalı Linux'ta Başlık Çubuğu Düğmeleri**

Firefox'un başlık çubuğu düğmeleri Windows tarzına geri dönebilir. Bunu önlemek için, “Gelişmiş Tercihler”i (`about:config`) açın ve `widget.gtk.non-native-titlebar-buttons.enabled` özelliğini `false` olarak ayarlayın. ([@anselstetter](https://github.com/anselstetter/)'e teşekkürler)

**Güvenlik İçin Hatırlatma**

Kötü niyetli web arayüzlerine karşı dikkatli olun. Tarayıcı arayüzüyle web sayfasının arayüzü arasındaki ayrımın farkında olmak önemlidir. Daha fazla bilgi için lütfen [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/) makalesine başvurun. ([u/KazaHesto](https://www.reddit.com/user/KazaHesto/)'ya teşekkürler)

Bu projeyi GitHub'da yıldızlamaktan çekinmeyin: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
