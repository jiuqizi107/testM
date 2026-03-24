const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

// 获取退回台账列表
router.get('/', authMiddleware, (req, res) => {
  const { project_id, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT rt.*,
      r.title as requirement_title,
      v.name as version_name,
      u.real_name as operator_name
    FROM returns rt
    LEFT JOIN requirements r ON rt.requirement_id = r.id
    LEFT JOIN versions v ON rt.version_id = v.id
    LEFT JOIN users u ON rt.operator_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    sql += ' AND r.project_id = ?';
    params.push(project_id);
  }

  const countSql = sql.replace('SELECT rt.*,\n      r.title as requirement_title,\n      v.name as version_name,\n      u.real_name as operator_name', 'SELECT COUNT(*) as total');
  const countResult = db.queryOne(countSql, params);
  const total = countResult?.total || 0;

  sql += ' ORDER BY rt.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const returns = db.queryAll(sql, params);

  res.json({
    list: returns,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

// 创建退回记录
router.post('/', authMiddleware, (req, res) => {
  const { requirement_id, version_id, reason } = req.body;

  if (!requirement_id || !reason) {
    return res.status(400).json({ message: '需求和退回原因不能为空' });
  }

  const result = db.run(`
    INSERT INTO returns (requirement_id, version_id, reason, operator_id)
    VALUES (?, ?, ?, ?)
  `, [requirement_id, version_id, reason, req.user.id]);

  res.status(201).json({
    message: '退回记录创建成功',
    id: result.lastInsertRowid
  });
});

// 删除退回记录
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM returns WHERE id = ?', [req.params.id]);
  res.json({ message: '退回记录删除成功' });
});

module.exports = router;
