# 01 - package.json：项目的"身份证"

> 视频讲解稿 · 对应文件：[package.json](../../package.json)

---

## 开场

每个 Node.js 项目的根目录下都有一个 `package.json`，它是项目的元数据文件。我们用 `npm init` 可以生成它，也可以手写。来看看我们这个文件里有什么。

---

## 逐段讲解

### 基本信息

```json
{
  "name": "simple-blog",
  "version": "1.0.0",
  "description": "简易博客系统",
  "main": "backend/server.js",
```

- **name** — 项目名称。发布到 npm 时作为包名，本地开发时只是一个标识。
- **version** — 语义化版本号 `主版本.次版本.修订号`（major.minor.patch）。1.0.0 代表第一个稳定版。
- **description** — 项目一句话描述，`npm search` 时会用到。
- **main** — **入口文件**。当别人 `require('simple-blog')` 时，Node.js 会加载这个文件。我们指向 `backend/server.js`，也就是 Express 服务器入口。虽然本项目不发布为 npm 包，但这个字段让项目结构清晰。

---

### scripts — 脚本命令

```json
  "scripts": {
    "start": "node backend/server.js",
    "dev": "node backend/server.js"
  },
```

- **scripts** 定义了可以用 `npm run <命令名>` 执行的脚本。
- **`npm start`** 是特殊命令，等价于 `npm run start`，但它是唯一可以省略 `run` 的命令。
- 执行 `npm start` → 实际运行 `node backend/server.js` → 启动 Express 服务器。
- **`npm run dev`** 这里和 start 一样，预留给你将来加 `nodemon`（自动重启）等开发工具。

> **知识点**：`scripts` 中的命令运行时会自动把 `node_modules/.bin` 加入 PATH，所以你可以直接用 `node`、`nodemon` 等命令，不需要写完整路径。

---

### dependencies — 依赖项（核心！）

```json
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^11.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2"
  }
}
```

版本号前的 `^` 是**兼容范围符号**：

- `^2.4.3` 表示 `>=2.4.3 且 <3.0.0`（允许次版本和修订号升级，不允许主版本升级）
- `~2.4.3` 表示 `>=2.4.3 且 <2.5.0`（只允许修订号升级）
- 不加符号表示锁定精确版本

下面逐一解释每个依赖的作用：

---

#### 1. express（`^4.18.2`）— Web 框架

```
没有 Express 时，你需要手写几百行代码解析 HTTP 请求。
Express 帮你做了：
  - 路由匹配（app.get('/path', handler)）
  - 中间件机制（app.use(...)）
  - 请求体解析（express.json()）
  - 静态文件托管（express.static()）
  - 响应方法封装（res.json(), res.status()）
```

Express 是 Node.js 生态中最流行的 Web 框架。它的核心理念是**中间件栈**——请求依次经过每个中间件处理，最后到达路由处理函数。

---

#### 2. better-sqlite3（`^11.0.0`）— SQLite 驱动

```
对比原版 sqlite3 包：
  sqlite3          → 异步回调 API：db.run(sql, (err) => {...})
  better-sqlite3   → 同步 API：const row = db.prepare(sql).get()
```

我们选择 `better-sqlite3` 的原因：
- **同步 API** 代码更直观，不需要 async/await 或回调嵌套
- **比异步版快 2-5 倍**（官方 benchmark 数据）
- 支持 `db.prepare()` 预编译语句，防止 SQL 注入

> **SQL 注入是什么？** 如果直接把用户输入拼接到 SQL 字符串中，攻击者可以注入恶意 SQL。`db.prepare('SELECT * FROM users WHERE id = ?').get(userInput)` 中的 `?` 是参数占位符，驱动会自动转义，安全！

---

#### 3. jsonwebtoken（`^9.0.2`）— JWT 认证

JWT = JSON Web Token。它的工作方式：

```
登录时：
  服务器用 jsonwebtoken.sign({ userId: 1 }, secretKey) → 生成 Token 字符串

请求时：
  浏览器在 Header 中携带 Authorization: Bearer <token>
  服务器用 jsonwebtoken.verify(token, secretKey) → 解码出 { userId: 1 }

Token 长这样（三个部分，用 . 分隔）：
  eyJhbGciOi...  .  eyJpZCI6MS...  .  L8kFPczDDC...
  └─ Header ──    └─ Payload ──    └─ Signature ──
  (Base64 编码)    (用户数据)        (防篡改签名)
```

- **无状态**：服务器不需要存 session，Token 本身包含了用户信息
- **可验证**：签名保证了 Token 没有被篡改
- **设置过期**：`expiresIn: '7d'` 表示 7 天后 Token 自动失效

---

#### 4. bcryptjs（`^2.4.3`）— 密码哈希

```
为什么不能用 MD5 或直接明文存密码？

明文存储   → 数据库泄露 = 所有用户密码泄露
MD5 哈希   → 彩虹表可以反查常见密码
bcrypt     → 每次哈希结果不同（随机盐值），暴力破解极慢
```

bcrypt 的核心特性：
- **盐值（Salt）**：自动生成随机盐值混入哈希，同一个密码两次 hash 结果不同
- **成本因子（Cost Factor）**：`hashSync(password, 10)` 中的 `10` 表示迭代 2^10=1024 次，数字越大越慢越安全
- **不可逆**：只能 `hash` 和 `compare`，无法从哈希值反推原文

---

#### 5. cors（`^2.8.5`）— 跨域资源共享

```
浏览器的同源策略：
  如果前端页面在 http://localhost:8080
  而后端 API 在 http://localhost:3000
  浏览器会阻止这个跨域请求！

cors 中间件做了什么：
  在响应头加上 Access-Control-Allow-Origin: *
  告诉浏览器：「这个 API 允许任何来源访问」
```

---

## 总结

`package.json` 定义了：

| 项目 | 内容 |
|------|------|
| 我是谁 | name, version, description |
| 怎么启动 | scripts.start → node backend/server.js |
| 从哪开始 | main → backend/server.js |
| 依赖什么 | 5 个包，各司其职 |

下一个文件，我们来看 Express 的入口 **server.js**，看这些依赖是如何被组装起来的。
