# 07 - style.css：前端全局样式

> 视频讲解稿 · 对应文件：[frontend/css/style.css](../../frontend/css/style.css)

---

## 开场

这个文件是整个博客系统的视觉层。我们不会逐行念 CSS 代码，而是按照"设计区块"来讲解——Reset 重置、导航栏、容器布局、认证卡片、按钮系统、文章列表、文章详情、响应式。

---

## 一、CSS Reset — 清除浏览器默认样式

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

这三个属性是几乎所有项目的标配：

- **`margin: 0; padding: 0`** — 清除所有元素的默认内外边距（浏览器会给 body, h1, p 等元素加默认 margin）
- **`box-sizing: border-box`** — 改变盒模型计算方式：

```
默认 content-box：
  元素宽度 = width + padding + border
  width: 100px; padding: 10px → 实际占用 120px

border-box：
  元素宽度 = width（已包含 padding + border）
  width: 100px; padding: 10px → content 宽度 = 80px，总占用 100px
```

`border-box` 让布局计算更直观——你设置 `width: 50%` 它就真的占 50%，不会因为加了 padding 而溢出。

---

### body 基础样式

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
  min-height: 100vh;
}
```

- **`font-family`** — 系统字体栈，优先使用操作系统原生字体（macOS 用 San Francisco，Windows 用 Segoe UI，都没有就用 Arial）
- **`#333`** — 正文用深灰色而非纯黑 `#000`，视觉更柔和
- **`line-height: 1.6`** — 行高，1.6 倍字号，提升可读性
- **`min-height: 100vh`** — 页面至少撑满整个视口高度

---

## 二、导航栏 — sticky 定位

```css
.navbar {
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;    /* 关键属性 */
  top: 0;
  z-index: 100;
}

.navbar .logo {
  font-size: 1.25rem;
  font-weight: 700;
}
```

### Flexbox 布局

```
justify-content: space-between → 子元素两端对齐

┌──────────────────────────────────────────────┐
│  📝 简易博客              [登录] [注册]       │
│  └─ logo                  └─ nav-links ────  │
└──────────────────────────────────────────────┘
```

### `position: sticky; top: 0` — 粘性定位

这是 CSS3 的新定位模式：
- 页面滚动时，导航栏"粘"在视口顶部不动
- 比 `position: fixed` 更好，因为它不脱离文档流（下面内容不会被遮挡需要手动加 padding）

---

## 三、认证卡片 — 居中与阴影

```css
.auth-page {
  display: flex;
  justify-content: center;   /* 水平居中 */
  align-items: center;       /* 垂直居中 */
  min-height: calc(100vh - 56px);  /* 扣除导航栏高度 */
}

.auth-card {
  background: #fff;
  padding: 40px 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  max-width: 400px;
}
```

- **`calc(100vh - 56px)`** — CSS 计算函数，总视口高度减去导航栏 56px，让卡片在剩余空间中居中
- **`border-radius: 12px`** — 圆角，现代风格
- **`box-shadow`** — 卡片投影，`rgba(0,0,0,0.08)` = 8% 不透明度的黑色，非常 subtle

---

## 四、表单控件 — focus 状态

```css
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}
```

- **`:focus`** — CSS 伪类，元素获得焦点时（用户点击 input 或 Tab 切换到它）
- **`outline: none`** — 去掉浏览器默认的聚焦轮廓（通常是蓝色方框）
- **`box-shadow`** — 自定义的聚焦指示——一个 3px 的蓝色光晕，比默认轮廓更好看，也符合无障碍设计

---

## 五、按钮系统

```css
.btn           → 基础按钮（display, padding, border-radius）
.btn-primary   → 蓝色主按钮（background: #2563eb）
.btn-danger    → 红色危险按钮（background: #dc2626）
.btn-secondary → 灰色次要按钮（background: #e5e5e5）
.btn-sm        → 小尺寸按钮变体
.btn-block     → 块级按钮（width: 100%）
```

这是一种**组件化 CSS 思路**：把共性抽到 `.btn`，差异用修饰类表达。体现了"组合优于继承"的原则。

---

## 六、文章列表 — hover 效果

```css
.post-item {
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: box-shadow 0.15s;  /* 过渡动画 */
}

.post-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

- **`transition: box-shadow 0.15s`** — 阴影变化在 0.15 秒内平滑过渡
- hover 时阴影加深，给用户"可点击"的视觉反馈

---

## 七、文章详情 — 正文排版

```css
.post-detail .post-content {
  font-size: 1rem;
  line-height: 1.8;
  white-space: pre-wrap;    /* 保留换行 */
  word-break: break-word;   /* 长单词/URL 换行 */
}
```

- **`white-space: pre-wrap`** — 保留文本中的换行符和多个空格，同时允许自动换行。这样用户在 textarea 中写的格式能原样展示。
- **`word-break: break-word`** — 防止长 URL 或英文长单词撑破布局。

---

## 八、响应式设计 — @media 查询

```css
@media (max-width: 600px) {
  .container { padding: 16px 12px; }
  .navbar { padding: 0 12px; }
  .auth-card { padding: 28px 20px; }
  .post-detail .post-title { font-size: 1.35rem; }
}
```

- **`@media (max-width: 600px)`** — 屏幕宽度 ≤ 600px 时应用这些样式
- 做减法：减小 padding、缩小字号、压缩间距
- 600px 是常见断点——大多数手机横屏也在 600px 以内

---

## 总结

这套 CSS 的设计思路：

1. **Reset** — 清空浏览器默认样式，统一起点
2. **布局系统** — Flexbox 处理所有布局需求
3. **组件化** — 按钮、表单、卡片都是可复用的样式组件
4. **渐进增强** — 基础样式 + hover/focus 状态 + 响应式退阶

下一个文件看 JS 层的 **api.js**——前端和后端之间的"接线员"。
