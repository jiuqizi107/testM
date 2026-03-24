const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/init');
const { generateToken, authMiddleware } = require('../middleware/auth');

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const user = db.queryOne('SELECT * FROM users WHERE username = ?', [username]);

  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: '登录成功',
    token,
    user: userWithoutPassword
  });
});

// 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
  const user = db.queryOne('SELECT id, username, real_name, email, role, avatar, created_at FROM users WHERE id = ?', [req.user.id]);

  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  res.json(user);
});

// 获取所有用户（用于分配）
router.get('/users', authMiddleware, (req, res) => {
  const users = db.queryAll('SELECT id, username, real_name, email, role FROM users');
  res.json(users);
});

// 修改密码
router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: '原密码和新密码不能为空' });
  }

  const user = db.queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

  const isValidPassword = bcrypt.compareSync(oldPassword, user.password);
  if (!isValidPassword) {
    return res.status(400).json({ message: '原密码错误' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

  res.json({ message: '密码修改成功' });
});

module.exports = router;
