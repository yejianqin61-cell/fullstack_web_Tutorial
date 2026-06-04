# 02 - server.js：Express 应用入口

> 视频讲解稿 · 对应文件：[backend/server.js](../../backend/server.js)

---

## 开场

这个文件是整个后端的「大本营」。它负责：
1. 引入所有依赖和路由模块
2. 装配中间件
3. 挂载路由
4. 托管前端静态文件
5. 启动 HTTP 服务器

---

## 逐行讲解

### 1. 模块引入

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
```

**Node.js 模块系统（CommonJS）**：

- `require('express')` → 从 `node_modules/express/` 加载第三方包
- `require('./routes/auth')` → 加载项目内的文件（`./` 表示当前目录）
- `require('path')` → **Node.js 内置模块**，不需要 npm install，处理文件路径用

> **知识点**：Node.js 有三种模块来源：
> 1. **内置模块**（path, fs, http...）→ 直接 `require('模块名')`
> 2. **第三方模块**（express, cors...）→ `require('模块名')`，从 `node_modules/` 查找
> 3. **项目模块**（我们写的文件）→ `require('./相对路径')`

---

### 2. 创建 Express 应用实例

```javascript
const app = express();
const PORT = process.env.PORT || 8080;
```

- **`express()`** 是一个工厂函数，返回一个 Express 应用对象。这个对象上有 `.use()`, `.get()`, `.post()`, `.listen()` 等方法。
- **`process.env.PORT`** — 从环境变量读取端口号。这样可以灵活部署：
  ```bash
  # Windows PowerShell
  $env:PORT=4040; npm start

  # Linux/Mac
  PORT=4040 npm start
  ```
  如果没设环境变量，就用默认的 `8080`。

---

### 3. 装配中间件

```javascript
// 中间件
app.use(cors());
app.use(express.json());
```

#### `app.use()` — 中间件注册方法

`app.use(中间件)` 告诉 Express：「每一个请求都要先经过这个中间件处理」。

**中间件的本质**是一个函数：`(req, res, next) => { ... }`，它拦截请求，做点什么，然后调用 `next()` 交给下一个中间件。

#### `cors()` — 跨域中间件

```javascript
app.use(cors());
```

等价于：

```javascript
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

加了这行，浏览器就不会拦截前端 JS 发出的跨域请求了。

#### `express.json()` — 请求体解析中间件

```javascript
app.use(express.json());
```

HTTP 请求的 body 是原始的字节流。`express.json()` 会：
1. 读取请求体的原始数据
2. 如果 `Content-Type` 是 `application/json`，就 `JSON.parse()` 解析
3. 把结果放到 `req.body` 上

**不加这个中间件的话，`req.body` 就是 `undefined`，你的所有 POST/PUT 接口都拿不到数据！**

---

### 4. 托管静态文件

```javascript
app.use(express.static(path.join(__dirname, '..', 'frontend')));
```

- **`__dirname`** — Node.js 的全局变量，始终等于当前文件所在的目录的**绝对路径**。这里 `__dirname` = `<项目>/backend/`
- **`path.join(__dirname, '..', 'frontend')`** — 拼接路径，`..` 是上级目录，结果是 `<项目>/frontend/`
- **`express.static(目录)`** — 返回一个中间件，把指定目录下的文件映射为 URL 路径

等价效果：

```
浏览器访问 http://localhost:8080/index.html
Express 返回 <项目>/frontend/index.html

浏览器访问 http://localhost:8080/css/style.css
Express 返回 <项目>/frontend/css/style.css

浏览器访问 http://localhost:8080/js/api.js
Express 返回 <项目>/frontend/js/api.js
```

---

### 5. 挂载路由

```javascript
// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
```

- **`app.use('/api/auth', authRoutes)`** — 所有以 `/api/auth` 开头的请求，都交给 `authRoutes` 这个路由模块处理。
- `authRoutes` 里定义 `router.post('/register', ...)` → 最终路径就是 `/api/auth/register`。
- `postRoutes` 里定义 `router.get('/', ...)` → 最终路径就是 `/api/posts`。

**这就是 Express 路由的模块化设计**：每个功能模块定义自己的路由前缀和方法，在主文件中统一挂载。

---

### 6. SPA 回退路由（重要！）

```javascript
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});
```

这一段解决什么问题？

我们的前端是多个 HTML 页面，`express.static` 已经能处理 `/index.html`、`/login.html` 这些明确路径。但如果用户直接访问一个不存在的路径（比如刷新详情页），我们需要有合理的处理。

- **正则表达式 `/^\/(?!api\/).*/`**：匹配所有以 `/` 开头但**不是** `/api/` 开头的路径
- **`res.sendFile(...)`**：返回 `index.html`

> 实际上因为 `express.static` 已经处理了静态文件，这个回退主要是个兜底保护。前端通过 `window.location.href` 做页面跳转不需要这个，但这个 fallback 保证了 API 路径不会误匹配。

---

### 7. 启动服务器

```javascript
const server = app.listen(PORT, () => {
  console.log(`博客系统已启动: http://localhost:${PORT}`);
});
```

- **`app.listen(端口, 回调)`** — 启动 HTTP 服务器，开始监听指定端口
- 回调函数在服务器**启动成功后**执行，打印访问地址

---

### 8. 端口占用的友好处理

```javascript
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请先关闭占用该端口的程序...`);
    process.exit(1);
  } else {
    throw err;
  }
});
```

- **`server.on('error', ...)`** — 监听服务器的 error 事件
- **`EADDRINUSE`** 是系统级错误码，表示"地址已被使用"
- **`process.exit(1)`** — 退出进程，`1` 表示异常退出（`0` 是正常退出）

---

## 请求生命周期示意图

```
一个 GET /api/posts 请求的完整旅程：

  client → [cors()] → [express.json()] → [路由匹配]
                                            ↓
                              匹配到 app.use('/api/posts', ...)
                                            ↓
                              进入 routes/posts.js → router.get('/')
                                            ↓
                              查询数据库 → res.json(posts)
                                            ↓
  client ← [Express 自动序列化 JSON] ← ← ← ←┘
```

---

## 总结

`server.js` 做的事情就是"装配流水线"：

1. 创建 Express 实例
2. 装上 cors（跨域头）和 json 解析器（读 body）
3. 装上静态文件服务（托管前端）
4. 装上路由模块（处理 API）
5. 启动监听

整个流程像搭积木一样清晰。下一个文件，我们看数据库层 **db.js**。
