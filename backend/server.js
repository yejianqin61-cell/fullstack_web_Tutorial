const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件（前端页面）
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// SPA fallback - 所有非 API 路由返回 index.html
app.get(/^\/(?!api\/).*/, (req, res) => {
  // 让浏览器处理前端路由
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`博客系统已启动: http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请先关闭占用该端口的程序，或设置环境变量 PORT 使用其他端口`);
    process.exit(1);
  } else {
    throw err;
  }
});
