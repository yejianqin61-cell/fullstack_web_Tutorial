# 05 - routes/auth.js：注册与登录

> 视频讲解稿 · 对应文件：[backend/routes/auth.js](../../backend/routes/auth.js)

---

## 开场

这个文件处理用户体系的入口——注册和登录。这里面涉及表单校验、密码哈希、SQL 插入/查询、JWT 签发等核心流程。

---

## 逐行讲解

### 1. 模块引入

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
```

- **`express.Router()`** — 创建一个"子路由"对象，和 `app` 一样有 `.get()`, `.post()` 等方法，但是它不会监听端口，必须挂载到 `app.use()` 上。
- **`bcrypt`** — 密码加密库，纯 JS 实现，不需要编译
- **`jwt`** — 签发 Token
- **`db`** — 我们在 `db.js` 中导出的 SQLite 连接
- **`JWT_SECRET`** — 从 `middleware/auth.js` 中导入，保证签发和验证使用同一密钥

---

### 2. 创建 Router

```javascript
const router = express.Router();
```

`express.Router()` 就像一个"迷你 app"，可以定义自己的路由，最后 `module.exports = router` 导出，在 `server.js` 中用 `app.use('/api/auth', router)` 挂载。

---

### 3. 注册接口 `POST /api/auth/register`

```javascript
router.post('/register', (req, res) => {
  const { username, password } = req.body;
```

#### `const { username, password } = req.body` — 对象解构

这是 ES6 的解构赋值语法，等价于：

```javascript
const username = req.body.username;
const password = req.body.password;
```

`req.body` 能拿到数据是因为 `server.js` 中已经挂载了 `express.json()` 中间件。

---

#### 输入校验

```javascript
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度需在 2-20 个字符之间' });
  }
  if (password.length < 4 || password.length > 50) {
    return res.status(400).json({ error: '密码长度需在 4-50 个字符之间' });
  }
```

**为什么要做校验？**

- **前端校验**（HTML 的 `minlength`、`required`）只是用户体验优化，可以被绕过
- **后端校验**才是最后的安全防线——攻击者可以直接用 curl 或 Postman 发请求

**状态码 400 Bad Request** — 表示"你的请求有问题"，通常是参数不合法。

**`return` 关键字很重要** — 如果不加 `return`，后面代码还会继续执行（res.json 不终止函数），可能导致 `Cannot set headers after they are sent` 错误。

> **Express 经典错误**：对同一个请求多次调用 `res.json()`。HTTP 只能响应一次，第二次就会报错。所以一旦返回错误响应，必须 `return`。

---

#### 密码哈希与数据库插入

```javascript
  try {
    const hashed = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, hashed);
    res.json({ message: '注册成功', userId: result.lastInsertRowid });
```

**`bcrypt.hashSync(password, 10)`**：

- `hashSync` — 同步版本。也有异步版 `hash()`，但 better-sqlite3 是同步的，用同步版更自然
- 第二个参数 `10` 是**盐值轮数（salt rounds）**：实际迭代次数 = 2^10 = 1024 次。越大越安全但越慢，10 是平衡点

**`db.prepare(sql)` — 预编译语句（Prepared Statement）**：

```javascript
const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
```

- `?` 是**参数占位符**——告诉 SQLite：「这里有一个参数，稍后传入」
- `prepare` 把 SQL 模板发送给 SQLite 编译一次，之后可以多次调用
- `stmt.run(username, hashed)` — 用实际参数执行

> **这就是防 SQL 注入的方式**：参数值永远不会被当作 SQL 代码解释。如果有人输入用户名 `'; DROP TABLE users; --`，它会原样存入数据库，而不是执行恶意 SQL。

**`result.lastInsertRowid`** — better-sqlite3 返回的结果对象，包含刚插入的行的自增 id。

---

#### 错误处理

```javascript
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '用户名已存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
```

- **`SQLITE_CONSTRAINT_UNIQUE`** — better-sqlite3 在违反 UNIQUE 约束时抛出的错误码。这比先 `SELECT` 再判断存在与否更高效（少一次查询），也更安全（避免了竞态条件）。
- **500 Internal Server Error** — 通用服务端错误，兜底处理

---

### 4. 登录接口 `POST /api/auth/login`

```javascript
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
```

登录的校验和注册一样，先确保必填字段非空。

---

#### 查询用户

```javascript
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }
```

- **`db.prepare(sql).get(param)`** — `get()` 返回**第一行**结果。如果没查到，返回 `undefined`。
- **SQL `WHERE` 子句** — `WHERE username = ?`，等值查询。

> **安全提示**：错误消息不说"用户不存在"而说"用户名或密码错误"，这是为了防止用户枚举攻击——攻击者无法通过错误消息判断一个用户名是否已被注册。

---

#### 验证密码

```javascript
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }
```

**`bcrypt.compareSync(明文密码, 数据库中的哈希)`**：

这个方法内部会：
1. 从 `user.password` 中提取盐值
2. 用相同的盐值和轮数对 `password` 做哈希
3. 比较两个哈希值是否一致

> **为什么不能用 `===` 直接比较？** 因为 bcrypt 每次哈希结果不同（盐值随机），相同的密码两次 `hashSync` 得到的结果不同。必须用 `compareSync`。

---

#### 签发 JWT Token

```javascript
  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
```

**`jwt.sign(payload, secret, options)`**：

- **payload** — 要放进 Token 的数据。**不要放敏感信息**（密码等），因为 Token 的 payload 部分只是 Base64 编码，任何人拿到 Token 都能解码看到内容。
- **secret** — 签名密钥
- **options** — 配置项：
  - `expiresIn: '7d'` — 过期时间 7 天。也可以用秒数（`60 * 60 * 24 * 7 = 604800`）
  - 还可设 `issuer`（签发者）、`audience`（接收者）等

---

#### 返回结果

```javascript
  res.json({
    message: '登录成功',
    token,
    user: { id: user.id, username: user.username }
  });
```

- 返回 Token（前端存 localStorage 里，后续请求带上）
- 返回用户基本信息（前端用来显示"已登录为 xxx"）
- **密码不在返回结果中**——这是基本原则

---

### 5. 导出 Router

```javascript
module.exports = router;
```

---

## 注册流程时序图

```
客户端                    服务端                       数据库
  │                        │                           │
  │  POST /api/auth/register│                           │
  │  {username, password}  │                           │
  │ ─────────────────────→ │                           │
  │                        │ 校验 username 和 password  │
  │                        │ bcrypt.hashSync(password)  │
  │                        │                           │
  │                        │  INSERT INTO users         │
  │                        │ ────────────────────────→ │
  │                        │ ← 返回 lastInsertRowid    │
  │                        │                           │
  │ ← 200 {message, userId}│                           │
```

## 登录流程时序图

```
客户端                    服务端                       数据库
  │                        │                           │
  │  POST /api/auth/login  │                           │
  │  {username, password}  │                           │
  │ ─────────────────────→ │                           │
  │                        │  SELECT FROM users         │
  │                        │  WHERE username = ?       │
  │                        │ ────────────────────────→ │
  │                        │ ← 返回用户记录（含哈希密码）│
  │                        │                           │
  │                        │ bcrypt.compareSync(...)    │
  │                        │ jwt.sign({id, username})   │
  │                        │                           │
  │ ← 200 {token, user}   │                           │
```

---

## 总结

- **注册**：校验 → bcrypt 哈希密码 → INSERT into users → 返回 userId
- **登录**：校验 → SELECT 查用户 → bcrypt 比对密码 → JWT 签发 Token → 返回
- **两个关键安全原则**：
  1. 密码永不明文存储（bcrypt 哈希）
  2. 错误消息不泄露信息（不区分"用户不存在"和"密码错误"）

下一个文件看博客的核心——**文章的 CRUD**。
