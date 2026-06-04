# 04 - middleware/auth.js：JWT 认证中间件

> 视频讲解稿 · 对应文件：[backend/middleware/auth.js](../../backend/middleware/auth.js)

---

## 开场

当你访问需要登录才能用的功能时（比如发布文章），服务器怎么知道"你是谁"？这就是认证中间件的职责。这篇我们深入理解中间件机制和 JWT 工作原理。

---

## 逐行讲解

### 1. 引入 JWT 库和密钥

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'blog_secret_key_2024';
```

- **`jsonwebtoken`** — npm 包，提供 `sign()`（签发）和 `verify()`（验证）两个核心方法
- **`JWT_SECRET`** — 签名密钥。这就像一枚只有服务器知道的"印章"，用它签发的 Token 只有用它才能验证。

> **安全建议**：生产环境中应该在环境变量中设置强随机密钥：
> ```bash
> # 生成随机密钥（Linux/Mac）
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
>
> # 部署时注入环境变量
> $env:JWT_SECRET="your-random-secret"; npm start
> ```

---

### 2. 中间件函数

```javascript
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
```

**中间件函数签名 `(req, res, next)`**：

- **`req`**（Request）— 请求对象，包含 header、body、URL 参数等所有请求信息
- **`res`**（Response）— 响应对象，有一系列方法（`.json()`, `.status()`, `.send()` 等）来构造响应
- **`next`** — 一个回调函数。调用 `next()` 表示"我处理完了，交给下一个中间件/路由"；不调用 `next()` 则表示"到此为止，我直接返回响应了"

> **核心概念**：中间件像一个过滤器链。请求进来，依次经过每个中间件，任何一个环节都可以决定"放行"（next）或"拦截"（res.json）。

---

### 3. 检查 Authorization 请求头

```javascript
const header = req.headers.authorization;
if (!header || !header.startsWith('Bearer ')) {
  return res.status(401).json({ error: '请先登录' });
}
```

**HTTP 状态码**：

- **`401 Unauthorized`** — "未认证"，你没带凭证或者凭证无效。HTTP 标准中，401 响应可以带 `WWW-Authenticate` 头（这里我们没带），告诉客户端应该如何认证。

**Bearer Token 格式**：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
               └─────┬─────┘└────────┬────────┘
                认证方案(scheme)    凭证(token)
```

- **`Bearer`** 是 OAuth 2.0 定义的一种 token 使用方式，意思是"持有此 token 即代表身份"
- `header.startsWith('Bearer ')` 检查必须以 `Bearer ` 开头（注意后面有个空格）

> **如果不带 header** → `header` 是 `undefined` → 返回 401
> **如果带了但格式不对**（如直接传 token，没有 `Bearer ` 前缀）→ 返回 401

---

### 4. 提取并验证 Token

```javascript
const token = header.split(' ')[1];
try {
  const payload = jwt.verify(token, JWT_SECRET);
  req.user = payload;
  next();
} catch (err) {
  return res.status(401).json({ error: '登录已过期，请重新登录' });
}
```

#### `jwt.verify(token, secret)` 内部做了三件事：

```
1. 用 secret 重新计算签名
2. 对比计算出的签名和 token 中的签名是否一致
   → 不一致 → 说明 token 被篡改过 → 抛出异常
   → 一致 → 说明 token 是服务器签发的，可信
3. 检查 token 是否过期（exp 字段）
   → 已过期 → 抛出 TokenExpiredError
   → 未过期 → 返回 payload 对象
```

#### `req.user = payload` — 向后续中间件传递数据

这是 Express 中间件的关键模式：**前一个中间件在 `req` 上挂数据，后续的所有中间件和路由处理函数都能读取到**。

`payload` 的内容（来自登录时 `jwt.sign()` 的第一个参数）：

```javascript
{ id: 1, username: 'test', iat: 1780573780, exp: 1781178580 }
//  └ 用户ID   └ 用户名          └ 签发时间      └ 过期时间
```

这样在 `routes/posts.js` 中就可以直接用 `req.user.id` 知道是谁在发请求。

---

### 5. 导出

```javascript
module.exports = { authMiddleware, JWT_SECRET };
```

- 导出 `authMiddleware` — 给 `routes/posts.js` 的路由使用
- 导出 `JWT_SECRET` — 给 `routes/auth.js` 签发 Token 时使用，保证签发和验证用的是同一把密钥

---

## 中间件使用示例

在路由中这样使用：

```javascript
// 公开路由——不需要认证
router.get('/', (req, res) => { ... });

// 受保护路由——加了 authMiddleware，必须带有效 Token 才能访问
router.post('/', authMiddleware, (req, res) => {
  // 这里可以安全地使用 req.user.id
  console.log('当前用户ID:', req.user.id);
});
```

当 `authMiddleware` 调用 `next()` 时，请求才会进入后面的处理函数；如果它返回了 401，后面的处理函数根本不会执行。

---

## 认证流程图

```
请求: POST /api/posts  (带 Authorization: Bearer xxx)
  │
  ▼
authMiddleware(req, res, next)
  │
  ├─ 没有 Authorization header? ──→ 401 "请先登录"
  │
  ├─ header 格式不正确? ──→ 401 "请先登录"
  │
  ├─ jwt.verify() 失败（过期/篡改）? ──→ 401 "登录已过期"
  │
  └─ 验证通过 ──→ req.user = payload ──→ next() ──→ 进入路由处理函数
```

---

## 总结

认证中间件就是一道"安检门"：

1. 检查你是否带了令牌（Authorization header）
2. 验证令牌是否有效（jwt.verify）
3. 把用户信息挂在 `req.user` 上放行（next）
4. 或者直接拒绝（401）

下一个文件看**注册和登录路由**，看 Token 是怎么被签发出来的。
