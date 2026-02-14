**O que a extensão faz?**

Essa extensão ajusta dinamicamente o tema do Firefiox para combinar com a aparência do site que você está visualizando, similar a função de coloração das abas do macOS

**Funciona bem com**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Incompatível com**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Qualquer outra extensão que modifique o tema do Firefox

**Removendo a sombra abaixo da barra de ferramentas**

Para remover a fina sombra projetada por conteúdo web na barra de ferramentas, vá em Opções (`about:preferences`) e desative “Mostrar Painel Lateral” na seção "Disposição do Navegador". Alternativamente, adicione o seguinte código a seu tema CSS:

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Customizando transições de cor**

Devido à limitações técnicas, a transição suave de cores para a barra de abas não tem suporte nativo. Entretanto, você pode ativar esse efeito adicionando o seguinte código a seu tema CSS (graças a [@Moarram](https://github.com/Moarram/)):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar {`

> > `transition:`

> > > `background-color 0.5s cubic-bezier(0, 0, 0, 1), border-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

Para ativar a transição suave de cores na interface da Sidebery, adicione o seguinte código ao Editor de Estilo da Sidebery (graças a [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

Alternativamente, se você deseja remover a transição de cor integrada do Firefox na barra de ferramentas para uma mudança de cores instantânea, adicione o seguinte código a seu tema CSS:

> `:root {`

> > `--ext-theme-background-transition: none !important;`

> `}`

**Compatibilidade com temas CSS de terceiros**

Um tema de CSS de terceiros funciona com Adaptive Tab Bar Colour (ATBC), desde que use as variáveis de cor padrão do Firefox (por exemplo: `--lwt-accent-color` para a cor da barra de abas). [Esse](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) é um exemplo de um tema CSS compatível com ATBC.

**Botões da barra de título no Linux com tema GTK**

Os botões da barra de título do Firefox podem voltar ao estilo do Windows. Para prevenir isso, vá em “Preferências Avançadas” (`about:config`) e defina `widget.gtk.non-native-titlebar-buttons.enabled` como `false`. (graças a [@anselstetter](https://github.com/anselstetter/))

**Lembrete de segurança**

Tenha cuidado com interfaces web maliciosas. É importante distinguir entre a interface do navegador e a interface web. Para mais informações, acesse [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (graças a [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Sinta-se à vontade para favoritar esse projeto no GitHub: [https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour](https://github.com/easonwong-de/Adaptive-Tab-Bar-Colour)
