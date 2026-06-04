const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

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

// PUT /api/posts/:id - 编辑文章（仅作者本人）
router.put('/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }
  if (post.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权编辑此文章' });
  }

  const { title, content } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '内容不能为空' });
  }

  db.prepare('UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title.trim(), content.trim(), req.params.id);

  res.json({ message: '更新成功' });
});

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

module.exports = router;
