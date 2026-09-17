# FruitMerging · 水果实验室

提供 `dist/index.html` 网页版和 `dist/phone.html` 手机壳版。

## 体验地址

- [网页版](https://jdb156158.github.io/FruitMerging/)
- [手机壳版](https://jdb156158.github.io/FruitMerging/phone.html)

## 本地运行

```sh
python3 -m http.server 5173 --directory dist
```

打开 http://localhost:5173/ 或 http://localhost:5173/phone.html 。

包含九级水果合成、软体变形、三种流动性、连融计分、最佳分数本地保存、下一颗预览、音效、暂停、重开、帮助、能量恢复、搅动、倾斜、超线三秒结束、西瓜达成与继续挑战。手机支持拖动瞄准、松手投放及按住倾斜。

参考及初始页面、物理实现和水果图集来自用户指定的 https://melon-game.jack-514.chatgpt.site/ 。本项目保留参考玩法，添加手机壳展示和响应式适配，移除原站基础设施注入脚本；运行时所有游戏资源均在本地，无需请求参考站。

## 验证

`node --test tests/physics.test.js` 验证合成、最高级消除、三模式稳定性和超线计时。已检查手机壳页面390×844布局及模式、能量、暂停/继续交互。
