const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

// 获取版本列表
router.get('/', authMiddleware, (req, res) => {
  const { project_id, status } = req.query;

  let sql = `
    SELECT v.*, p.name as project_name
    FROM versions v
    LEFT JOIN projects p ON v.project_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    sql += ' AND v.project_id = ?';
    params.push(project_id);
  }

  if (status) {
    sql += ' AND v.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY v.created_at DESC';

  const versions = db.queryAll(sql, params);
  res.json(versions);
});

// 创建版本
router.post('/', authMiddleware, (req, res) => {
  const { project_id, name, description, release_date } = req.body;

  if (!project_id || !name) {
    return res.status(400).json({ message: '项目和版本名称不能为空' });
  }

  const result = db.run(`
    INSERT INTO versions (project_id, name, description, release_date)
    VALUES (?, ?, ?, ?)
  `, [project_id, name, description, release_date]);

  res.status(201).json({
    message: '版本创建成功',
    id: result.lastInsertRowid
  });
});

// 更新版本
router.put('/:id', authMiddleware, (req, res) => {
  const { name, description, status, release_date } = req.body;

  db.run(`
    UPDATE versions
    SET name = ?, description = ?, status = ?, release_date = ?
    WHERE id = ?
  `, [name, description, status, release_date, req.params.id]);

  res.json({ message: '版本更新成功' });
});

// 删除版本
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM versions WHERE id = ?', [req.params.id]);
  res.json({ message: '版本删除成功' });
});

module.exports = router;
