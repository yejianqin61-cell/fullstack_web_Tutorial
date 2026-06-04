# 08 - js/api.js：HTTP 请求封装层

> 视频讲解稿 · 对应文件：[frontend/js/api.js](../../frontend/js/api.js)

---

## 开场

这个文件是前端和后端之间的"接线员"——封装了所有 HTTP 请求的逻辑。为什么需要封装？因为每个请求都需要做三件事：带 Token、解析 JSON、处理错误。封装的好处是**写一次，处处复用**。

---

## 逐段讲解

### 1. 定义 API 基础路径

```javascript
const API_BASE = '/api';
```

把所有 API 请求的前缀统一管理。因为前后端同域部署（都是 localhost:8080），所以用相对路径即可，不需要完整 URL。

---

### 2. 核心请求函数

```javascript
async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error(data.error || '请求失败');
  }

  return data;
}
```

---

### 逐行详解

#### `async function request(url, options = {})`

- **`async`** — 声明这是一个异步函数，内部可以用 `await`
- **`options = {}`** — 参数默认值，调用时可以不传第二个参数

#### 读取 Token

```javascript
const token = localStorage.getItem('token');
```

- **`localStorage`** — 浏览器的本地存储 API，数据持久化在用户电脑上，关闭浏览器不会丢失
- `getItem('token')` — 读取名为 `token` 的值，如果没存过就返回 `null`

---

#### 构造请求头

```javascript
const headers = {
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...options.headers
};
```

这里用了 **ES6 扩展运算符（Spread Operator）** 写出简洁的条件赋值：

```javascript
// 如果 token 存在：
...(token ? { Authorization: `Bearer ${token}` } : {})
// 展开后：
headers = { 'Content-Type': 'application/json', Authorization: 'Bearer xxx...' }

// 如果 token 不存在：
...{}
// 展开后：
headers = { 'Content-Type': 'application/json' }
```

- **`Content-Type: application/json`** — 告诉服务器请求体是 JSON 格式，Express 的 `express.json()` 中间件依赖这个头
- **`Authorization: Bearer ${token}`** — Token 认证，格式必须严格遵循

> **模板字面量** `${token}` — ES6 语法，用反引号包裹，`${}` 内可嵌入变量。

---

#### 发送请求

```javascript
const res = await fetch(`${API_BASE}${url}`, {
  ...options,
  headers
});
```

- **`fetch()`** — 浏览器原生 API，发起 HTTP 请求，返回 Promise
- **`await`** — 等待 Promise 完成，拿到 Response 对象
- **`${API_BASE}${url}`** — 拼接完整路径，如 `/api` + `/posts` = `/api/posts`

---

#### 解析响应

```javascript
const data = await res.json();
```

- **`res.json()`** — Response 对象的方法，读取响应体并解析为 JSON 对象，也返回 Promise
- 注意这里用的是 `await`，所以 `data` 是解析后的对象，不是 Promise

---

#### 错误处理

```javascript
if (!res.ok) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  throw new Error(data.error || '请求失败');
}
```

- **`res.ok`** — 布尔值，状态码 200-299 为 `true`，其他为 `false`
- **401 特殊处理** — Token 过期或无效时，自动清除本地登录状态。这样用户下次操作时就会自然地跳转登录页。
- **`throw new Error(...)`** — 抛出异常，调用方可以用 `try...catch` 捕获

---

### 3. HTTP 方法快捷函数

```javascript
function get(url) {
  return request(url, { method: 'GET' });
}

function post(url, body) {
  return request(url, { method: 'POST', body: JSON.stringify(body) });
}

function put(url, body) {
  return request(url, { method: 'PUT', body: JSON.stringify(body) });
}

function del(url) {
  return request(url, { method: 'DELETE' });
}
```

这些函数只做一件事：把 HTTP 方法名传给 `request()`。

- **`JSON.stringify(body)`** — 把 JS 对象转为 JSON 字符串。`{ title: 'hello' }` → `'{"title":"hello"}'`。这是必须的——HTTP 请求体只能是字符串或二进制，不能直接传 JS 对象。
- **`del` 而不是 `delete`** — `delete` 是 JS 的保留关键字（用于删除对象属性），不能用作函数名

---

### 使用示例

```javascript
// 获取文章列表
const posts = await get('/posts');

// 登录
const data = await post('/auth/login', { username: 'alice', password: '1234' });

// 编辑文章
await put('/posts/5', { title: '新标题', content: '新内容' });

// 删除文章
await del('/posts/5');
```

对比不用封装时：

```javascript
// 不用封装——每个请求都要写这些
const res = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({ title, content })
});
// ...
```

封装后代码量减少 80%，而且 Token 读取和错误处理逻辑集中管理。

---

## 数据流示意图

```
页面 JS
  │
  │  get('/posts')
  ▼
api.js: request()
  ├─ 读取 localStorage 的 token
  ├─ 构造 headers
  ├─ fetch('/api/posts')
  │     │
  │     ▼  ← ← ← ← ← ← ← ← ← ← ← 网络请求 → → → → → → → → → →
  │   Express 服务器                                     │  │
  │     ├─ cors()                                        │  │
  │     ├─ express.json()                                │  │
  │     ├─ 路由匹配 GET /api/posts                       │  │
  │     ├─ 查询数据库                                    │  │
  │     └─ res.json(posts)                               │  │
  │     → → → → → → → → → → →  → → → → → → → → → → → →  │
  │                                                       │
  ├─ await res.json()  ← 解析 JSON  ← ← ← ← ← ← ← ← ← ← ┘
  ├─ res.ok? → return data
  └─ !res.ok? → throw Error
```

---

## 总结

`api.js` 封装的核心价值：

1. **DRY（Don't Repeat Yourself）** — Token 注入、JSON 解析、错误处理只写一次
2. **关注点分离** — 页面 JS 只关心数据，不关心 HTTP 细节
3. **自动清理** — 401 时自动清除登录态

下一个文件看 **auth.js**——前端的状态管理。
