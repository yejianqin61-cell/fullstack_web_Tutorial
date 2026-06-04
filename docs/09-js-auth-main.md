# 09 - js/auth.js + main.js：前端认证与工具函数

> 视频讲解稿 · 对应文件：
> - [frontend/js/auth.js](../../frontend/js/auth.js)
> - [frontend/js/main.js](../../frontend/js/main.js)

---

## 第一部分：auth.js — 认证状态管理

### 开场

前端如何记住"用户已登录"这个状态？答案在 `localStorage` 和这个文件的五个函数中。

---

### 1. 获取当前用户

```javascript
function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
```

- **`localStorage.getItem('user')`** — 读取之前登录时存储的用户信息
- **`JSON.parse(user)`** — 把 JSON 字符串转回 JS 对象

```
存储时：localStorage.setItem('user', JSON.stringify({id:1, username:'alice'}))
         ↓
localStorage 里存的是字符串：'{"id":1,"username":"alice"}'
         ↓
读取时：JSON.parse('{"id":1,"username":"alice"}')
         ↓
得到 JS 对象：{ id: 1, username: 'alice' }
```

- **返回值**：查到返回用户对象，没查到返回 `null`

---

### 2. 判断登录状态

```javascript
function isLoggedIn() {
  return !!localStorage.getItem('token');
}
```

- **`!!`** — 双感叹号，将任意值转为布尔值：

```javascript
!!'eyJhbGci...'  → true   // 非空字符串 → true
!!null          → false  // null → false
!!undefined     → false
```

- 只检查 token 是否存在。为什么不同时验证 token 是否过期？因为解码 token 需要引入 JWT 库，而且后端会在请求时验证——前端只是做一个"乐观"判断。

---

### 3. 保存登录状态

```javascript
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
```

登录成功后调用，把两样东西存起来：
- **token** — 用于鉴权
- **user** — 用于显示"已登录为 xxx"

为啥不把 user 从 token 解码出来？token 的 payload 是 Base64 编码的，JS 可以解，但要引入 atob 还要处理过期时间。单独存一份更方便。

---

### 4. 退出登录

```javascript
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}
```

- **`localStorage.removeItem()`** — 删除指定键的数据
- **`window.location.href`** — 强制页面跳转，等价于用户在地址栏输入 URL

---

### 5. 更新导航栏（核心 UI 逻辑）

```javascript
function updateNavbar() {
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  const user = getCurrentUser();

  if (user) {
    navLinks.innerHTML = `
      <span class="user-info">👤 ${escapeHtml(user.username)}</span>
      <a href="/create.html" class="btn-primary">✏️ 写文章</a>
      <a href="/my.html">📄 我的文章</a>
      <button onclick="logout()">🚪 退出</button>
    `;
  } else {
    navLinks.innerHTML = `
      <a href="/login.html">登录</a>
      <a href="/register.html" class="btn-primary">注册</a>
    `;
  }
}
```

#### 两种状态的 UI

```
已登录：
┌─────────────────────────────────────────────────────┐
│ 📝 简易博客      👤 alice [写文章] [我的文章] [退出]  │
└─────────────────────────────────────────────────────┘

未登录：
┌─────────────────────────────────────────────────────┐
│ 📝 简易博客                    [登录] [注册]         │
└─────────────────────────────────────────────────────┘
```

- **`innerHTML`** — 直接替换元素内部的 HTML 内容
- **`escapeHtml(user.username)`** — 调用 main.js 中的函数，防止 XSS（万一用户名中有 `<script>` 标签）
- **`onclick="logout()"`** — 给退出按钮绑定点击事件

> **这个函数在每个页面的 `DOMContentLoaded` 事件中被调用**，保证每个页面都有统一的导航栏。

---

## 第二部分：main.js — 工具函数

### 6. HTML 转义（防 XSS）

```javascript
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

这是一个精巧的防 XSS 技巧：

1. 创建一个临时的 `<div>` 元素
2. 用 `.textContent` 设置文本——浏览器会将所有特殊字符（`<`, `>`, `&`, `"`）当作纯文本
3. 用 `.innerHTML` 读回——浏览器已经自动转义好了

```javascript
escapeHtml('<script>alert("xss")</script>')
// 返回：'&lt;script&gt;alert("xss")&lt;/script&gt;'
// HTML 渲染出来是纯文本，不会执行脚本
```

> **XSS（跨站脚本攻击）**：如果直接把用户输入插进 innerHTML，恶意脚本会被执行。用 `textContent` 再读 `innerHTML` 是最简单的防御方式。

---

### 7. 提示消息

```javascript
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type}`;
  el.style.display = 'block';
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.display = 'none';
}
```

- **默认参数** `type = 'error'` — 不传第三个参数时默认为 error 类型
- **CSS 类切换** — `alert-error` = 红色背景，`alert-success` = 绿色背景
- **`el.style.display = 'block'`** — 直接操作内联样式，`.alert` 的默认 `display: none` 被覆盖

---

### 8. 日期格式化（智能相对时间）

```javascript
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z');

  const now = new Date();
  const diff = now - d;
  const minute = 60000;      // 60 * 1000
  const hour = 3600000;      // 60 * 60 * 1000
  const day = 86400000;      // 24 * 60 * 60 * 1000

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
```

#### `new Date(dateStr + 'Z')`

SQLite 存储的时间格式是 `'2026-06-04 11:49:53'`（无时区）。加 `'Z'` 后缀表示 UTC 时间，保证 `new Date()` 解析正确。

#### 相对时间逻辑

```
刚刚       → 不到1分钟
5 分钟前    → 1-59分钟
3 小时前    → 1-23小时
2 天前      → 1-6天
2026-06-04  → 7天以上
```

这是社交媒体常用的时间显示方式，对用户更友好。

#### `Math.floor()` — 向下取整

`diff / hour = 3.7` → `Math.floor(3.7)` → `3` → "3 小时前"

#### `.padStart(2, '0')` — 补零

`String(5).padStart(2, '0')` → `'05'`，保证月份和日期始终是两位数。

---

### 9. 全局初始化

```javascript
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
});
```

- **`DOMContentLoaded`** — HTML 文档加载解析完毕后触发，此时 DOM 树已就绪，但图片等资源可能还没加载完
- 每个页面引入 `main.js` 后，这个监听器自动运行，导航栏自动渲染

---

## 总结

`auth.js` 和 `main.js` 是前端的基础设施层。它们共同提供了：

| 模块 | 功能 |
|------|------|
| auth.js | 登录态管理（存取删） + 导航栏 UI |
| main.js | XSS 防护 + 消息提示 + 日期格式化 + 初始化 |

这些函数在下面要讲的每个 HTML 页面中都会被用到。
