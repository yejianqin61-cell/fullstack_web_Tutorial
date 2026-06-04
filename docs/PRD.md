# 博客系统 PRD（产品需求文档）

## 1. 项目概述

### 1.1 项目名称
**简易博客系统 (Simple Blog)**

### 1.2 项目简介
一个轻量级的个人博客系统，支持用户注册登录、发布博客文章、对文章进行增删改查操作。采用前后端分离的架构，前端使用原生 HTML/CSS/JS，后端使用 Node.js + Express，数据库使用 SQLite。

### 1.3 目标用户
- 个人博客写作者
- 需要简单内容管理系统的用户

---

## 2. 功能需求

### 2.1 用户模块

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 用户注册 | 输入用户名和密码完成注册，密码加密存储 | P0 |
| 用户登录 | 输入用户名和密码登录，返回 JWT Token | P0 |
| 用户退出 | 清除本地 Token，跳转到登录页 | P0 |
| 登录状态保持 | 前端通过 localStorage 存储 Token，每次请求携带 Token | P0 |

### 2.2 博客文章模块

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 文章列表 | 展示所有已发布文章的标题、摘要、作者、发布时间 | P0 |
| 查看文章 | 点击文章标题进入文章详情页，展示完整内容 | P0 |
| 发布文章 | 登录用户可以创建新文章，包含标题和内容 | P0 |
| 编辑文章 | 文章作者可以修改自己文章的标题和内容 | P0 |
| 删除文章 | 文章作者可以删除自己的文章 | P0 |
| 我的文章 | 登录用户可以查看自己发布的所有文章 | P1 |

---

## 3. 技术架构

### 3.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | HTML + CSS + JavaScript | 原生开发，无框架 |
| 后端 | Node.js + Express | RESTful API |
| 数据库 | SQLite3 | 轻量级嵌入式数据库 |
| 认证 | JWT (JSON Web Token) | 无状态认证 |
| 密码加密 | bcryptjs | 密码哈希存储 |

### 3.2 项目目录结构

```
boke/
├── frontend/                # 前端代码
│   ├── index.html           # 首页（文章列表）
│   ├── login.html           # 登录页
│   ├── register.html        # 注册页
│   ├── create.html          # 发布/编辑文章页
│   ├── detail.html          # 文章详情页
│   ├── css/
│   │   └── style.css        # 全局样式
│   └── js/
│       ├── api.js           # API 请求封装
│       ├── auth.js          # 认证相关逻辑
│       └── main.js          # 通用工具函数
├── backend/                 # 后端代码
│   ├── server.js            # Express 服务入口
│   ├── db.js                # 数据库连接与初始化
│   ├── middleware/
│   │   └── auth.js          # JWT 认证中间件
│   └── routes/
│       ├── auth.js          # 用户注册/登录路由
│       └── posts.js         # 文章 CRUD 路由
├── docs/
│   └── PRD.md               # 本文件
└── package.json             # 项目依赖配置
```

### 3.3 数据库设计

#### users 表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户ID |
| username | TEXT | UNIQUE, NOT NULL | 用户名 |
| password | TEXT | NOT NULL | 加密后的密码 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 注册时间 |

#### posts 表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 文章ID |
| title | TEXT | NOT NULL | 文章标题 |
| content | TEXT | NOT NULL | 文章内容 |
| user_id | INTEGER | FOREIGN KEY → users(id) | 作者ID |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 发布时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 3.4 API 设计

#### 认证接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | 否 |
| POST | /api/auth/login | 用户登录 | 否 |

#### 文章接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/posts | 获取所有文章列表 | 否 |
| GET | /api/posts/:id | 获取单篇文章详情 | 否 |
| POST | /api/posts | 发布新文章 | 是 |
| PUT | /api/posts/:id | 编辑文章 | 是（仅作者） |
| DELETE | /api/posts/:id | 删除文章 | 是（仅作者） |
| GET | /api/posts/my | 获取当前用户的文章 | 是 |

---

## 4. 页面设计

### 4.1 页面清单

| 页面 | 文件 | 描述 |
|------|------|------|
| 首页 | index.html | 文章列表，顶部导航栏 |
| 登录页 | login.html | 用户名+密码登录表单 |
| 注册页 | register.html | 用户名+密码注册表单 |
| 文章详情 | detail.html | 展示文章完整内容 |
| 发布/编辑 | create.html | 新建或编辑文章的表单 |
| 我的文章 | my.html | 当前用户发布的文章列表 |

### 4.2 页面流程

```
首页（文章列表）
├── 未登录：导航栏显示 [登录] [注册]
├── 已登录：导航栏显示 [发布文章] [我的文章] [退出]
└── 点击文章标题 → 文章详情页
    └── 文章作者可见 [编辑] [删除] 按钮

登录页 → 登录成功 → 跳转首页
注册页 → 注册成功 → 跳转登录页
发布页 → 发布成功 → 跳转首页
编辑页 → 编辑成功 → 跳转文章详情页
```

---

## 5. 非功能需求

### 5.1 安全性
- 密码使用 bcryptjs 加密存储，不可明文
- JWT Token 设置过期时间（7天）
- 文章编辑/删除必须校验是否为作者本人

### 5.2 可用性
- 前端页面响应式设计，适配移动端和桌面端
- 表单提交前进行前端校验（非空等）
- 操作成功/失败有明确的提示信息

### 5.3 性能
- SQLite 适合单机小型应用，不做额外优化
- 前端使用原生 JS，无额外依赖库，加载快速

---

## 6. 开发计划

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| Phase 1 | 后端：数据库初始化 + 用户注册登录 API | 30 min |
| Phase 2 | 后端：文章 CRUD API + 认证中间件 | 30 min |
| Phase 3 | 前端：登录/注册页面 + 认证逻辑 | 30 min |
| Phase 4 | 前端：首页文章列表 + 文章详情页 | 30 min |
| Phase 5 | 前端：发布/编辑/删除文章功能 | 30 min |
| Phase 6 | 样式美化 + 整体联调测试 | 30 min |

---

## 7. 约束与假设

### 约束
- 不使用任何前端框架（React/Vue/Angular）
- 不引入构建工具（Webpack/Vite），直接用浏览器原生的 ES Module

### 假设
- 每个用户只能编辑/删除自己的文章
- 文章暂不支持分类、标签、评论等高级功能
- 发布文章不需要审核，直接发布
