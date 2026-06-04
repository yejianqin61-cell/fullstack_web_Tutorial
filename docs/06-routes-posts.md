# 06 - routes/posts.js：文章 CRUD + SQL 详解

> 视频讲解稿 · 对应文件：[backend/routes/posts.js](../../backend/routes/posts.js)

---

## 开场

这是整个后端最核心的文件——博客文章的全部增删改查操作。我们会详细讲解每一条 SQL 语句的设计思路，以及 Express 路由中的权限控制。

---

## Express Router 基础

```javascript
const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
```

和 `auth.js` 一样，创建一个 Router 实例。注意：
- `db` 是单例连接，整个应用共享
- `authMiddleware` 用于保护需要登录的路由

---

## 一、获取文章列表（READ - All）

```javascript
// GET /api/posts - 获取所有文章列表（公开）
router.get('/', (req, res) => {
  const posts = db.prepare(`
    SELECT p.id, p.title,
           substr(p.content, 1, 150) AS summary,
           p.user_id, u.username AS author,
           p.created_at, p.updated_at
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(posts);
});
```

### SQL 逐句解析

#### `SELECT ... FROM posts p JOIN users u ON p.user_id = u.id`

这是 SQL 中最核心的操作之一：**联表查询（JOIN）**。

```
posts 表                    users 表
┌────┬───────┬──────┬─────────┐  ┌────┬──────────┐
│ id │ title │ ...  │ user_id │  │ id │ username │
├────┼───────┼──────┼─────────┤  ├────┼──────────┤
│ 1  │ Hello │ ...  │ 1       │  │ 1  │ alice    │
│ 2  │ World │ ...  │ 2       │  │ 2  │ bob      │
└────┴───────┴──────┴─────────┘  └────┴──────────┘

JOIN 后的结果：
┌────┬───────┬─────────┬──────────┐
│ id │ title │ user_id │ username │
├────┼───────┼─────────┼──────────┤
│ 1  │ Hello │ 1       │ alice    │
│ 2  │ World │ 2       │ bob      │
└────┴───────┴─────────┴──────────┘
```

- **`p`** 和 **`u`** 是表的别名（alias），让 SQL 更简洁
- **`ON p.user_id = u.id`** 是连接条件：posts 表的 user_id 等于 users 表的 id

#### `substr(p.content, 1, 150) AS summary`

- **`substr(字符串, 起始位置, 长度)`** — SQLite 内置函数，截取子串
- 从第 1 个字符开始，取 150 个字符作为摘要
- **`AS summary`** — 给结果列起别名，返回的 JSON 中这个字段叫 `summary`

> **为什么不在 SELECT 时就返回完整 content？** 列表页只需要显示摘要，完整内容在详情页再加载。这减少了数据传输量，也保护了内容不被轻易爬取。

#### `ORDER BY p.created_at DESC`

- **`ORDER BY`** — 排序子句
- **`DESC`** — 降序（Descending），从新到旧排列
- **`ASC`** — 升序（Ascending）是默认值

#### `.all()`

- **`db.prepare(sql).all()`** — 返回**所有匹配行**的数组
- **`db.prepare(sql).get()`** — 返回**第一行**
- **`db.prepare(sql).run()`** — 执行写操作（INSERT/UPDATE/DELETE），返回 `{ changes, lastInsertRowid }`

---

## 二、获取我的文章（需登录）

```javascript
// GET /api/posts/my - 获取当前用户的文章（需登录）
router.get('/my', authMiddleware, (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.username AS author
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(posts);
});
```

### 关键点

#### `router.get('/my', authMiddleware, ...)`

注意 `/my` 路由放在 `/:id` 路由**之前**！这是关键细节：

```javascript
// ✅ 正确顺序
router.get('/my', authMiddleware, ...)   // 先匹配 '/my'
router.get('/:id', ...)                   // 再匹配 '/:id'

// ❌ 错误顺序——'/my' 会被 '/:id' 先捕获
router.get('/:id', ...)   // 'my' 被当作 id 参数！
router.get('/my', ...)    // 永远不会被匹配到
```

Express 按路由定义顺序匹配，所以**具体路径必须放在参数路径之前**。

#### `WHERE p.user_id = ?`

- `?` 被替换为 `req.user.id`（当前登录用户的 id）
- `req.user` 来自 `authMiddleware`，在前面中间件中被赋值

#### `SELECT p.*`

- `*` 表示所有列。`p.*` 是 posts 表的所有列——返回完整 content，因为"我的文章"页面需要完整信息做编辑。

---

##  三、获取文章详情（READ - One）

```javascript
// GET /api/posts/:id - 获取单篇文章详情（公开）
router.get('/:id', (req, res) => {
  const post = db.prepare(`
    SELECT p.*, u.username AS author
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }
  res.json(post);
});
```

### `:id` — 路由参数

- **`/:id`** 是 Express 的路由参数语法，`:` 开头的路径段会被捕获为参数
- **`req.params.id`** — 获取 URL 中 `:id` 位置的值。如 `GET /api/posts/5` → `req.params.id = '5'`

### 404 处理

```javascript
if (!post) {
  return res.status(404).json({ error: '文章不存在' });
}
```

- `.get()` 没查到返回 `undefined`，转换为 404 响应
- **HTTP 404 Not Found** — "资源不存在"

---

## 四、发布文章（CREATE）

```javascript
// POST /api/posts - 发布新文章（需登录）
router.post('/', authMiddleware, (req, res) => {
  const { title, content } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '内容不能为空' });
  }

  const stmt = db.prepare('INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)');
  const result = stmt.run(title.trim(), content.trim(), req.user.id);

  res.status(201).json({
    message: '发布成功',
    postId: result.lastInsertRowid
  });
});
```

### 关键点

#### `.trim()` — 去空白

```javascript
if (!title || !title.trim()) {
```

`trim()` 去除首尾空格。防止用户输入全空格的内容：
- `"   "` → `.trim()` → `""` → 判为空

#### `req.user.id`

文章的 `user_id` 字段取自身份认证中间件挂载的 `req.user.id`，**不是从请求体中来**。这保证了用户只能以自己身份发布文章，无法伪造作者。

#### HTTP 201 Created

- **201** 比 200 更精确地表达了"资源已创建"
- 严格 RESTful 规范中，201 还应该带 `Location` 响应头指向新资源 URL

---

## 五、编辑文章（UPDATE）

```javascript
// PUT /api/posts/:id - 编辑文章（仅作者本人）
router.put('/:id', authMiddleware, (req, res) => {
  // 第一步：查出文章，验证存在性
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }

  // 第二步：权限校验——只有作者本人能编辑
  if (post.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权编辑此文章' });
  }

  // 第三步：输入校验
  const { title, content } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '内容不能为空' });
  }

  // 第四步：执行更新
  db.prepare('UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title.trim(), content.trim(), req.params.id);

  res.json({ message: '更新成功' });
});
```

### 权限校验三步走

```
1. 404: 文章是否存在？
2. 403: 当前用户是不是作者？（post.user_id !== req.user.id）
3. 400: 输入是否合法？
```

- **HTTP 403 Forbidden** — "你登录了，但不是作者，没有权限"
- 403 vs 401 的区别：401 = 你没登录（或 Token 无效），403 = 你登录了但没权限

### `updated_at = CURRENT_TIMESTAMP`

```sql
UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
```

- `CURRENT_TIMESTAMP` 是 SQLite 函数，返回当前日期时间
- 每次编辑都更新这个字段，前端用 `updated_at !== created_at` 来判断是否显示"更新于"标签

---

## 六、删除文章（DELETE）

```javascript
// DELETE /api/posts/:id - 删除文章（仅作者本人）
router.delete('/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }
  if (post.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权删除此文章' });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});
```

### SQL DELETE 语法

```sql
DELETE FROM posts WHERE id = ?
```

- `WHERE id = ?` 限制只删除指定行
- **`WHERE` 子句在 DELETE 中绝对不可省略**！否则：

```sql
DELETE FROM posts;  -- ⚠️ 删掉整个表的所有数据！
```

所以删除前先 `SELECT` 验证存在性和权限，是一个安全的好习惯。

---

## HTTP 方法对照表

| HTTP 方法 | 路由 | 作用 | 认证 | 权限 |
|-----------|------|------|------|------|
| GET | `/api/posts` | 获取文章列表 | 否 | - |
| GET | `/api/posts/:id` | 获取文章详情 | 否 | - |
| GET | `/api/posts/my` | 获取我的文章 | 是 | - |
| POST | `/api/posts` | 发布文章 | 是 | - |
| PUT | `/api/posts/:id` | 编辑文章 | 是 | 仅作者 |
| DELETE | `/api/posts/:id` | 删除文章 | 是 | 仅作者 |

---

## 总结

这个文件展示了 RESTful API 的完整设计：

1. **路由优先级**：具体路径（`/my`）在前，参数路径（`/:id`）在后
2. **输入校验**：永远不要信任客户端传来的数据，后端要独立校验
3. **权限控制**：编辑和删除前，先确认操作者就是作者（`post.user_id === req.user.id`）
4. **SQL 安全**：使用 `db.prepare()` 参数化查询，不拼接 SQL 字符串
5. **HTTP 状态码**：200/201/400/401/403/404，每个都有明确语义

从这个文件开始，我们进入前端。下一个文件看 **style.css**，了解响应式布局的设计。
