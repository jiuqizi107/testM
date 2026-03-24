const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

// 获取缺陷列表
router.get('/', authMiddleware, (req, res) => {
  const { project_id, status, severity, priority, keyword, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT d.*,
      p.name as project_name,
      tc.title as testcase_title,
      u1.real_name as creator_name,
      u2.real_name as assignee_name
    FROM defects d
    LEFT JOIN projects p ON d.project_id = p.id
    LEFT JOIN test_cases tc ON d.testcase_id = tc.id
    LEFT JOIN users u1 ON d.creator_id = u1.id
    LEFT JOIN users u2 ON d.assignee_id = u2.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    sql += ' AND d.project_id = ?';
    params.push(project_id);
  }

  if (status) {
    sql += ' AND d.status = ?';
    params.push(status);
  }

  if (severity) {
    sql += ' AND d.severity = ?';
    params.push(severity);
  }

  if (priority) {
    sql += ' AND d.priority = ?';
    params.push(priority);
  }

  if (keyword) {
    sql += ' AND (d.title LIKE ? OR d.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const countSql = sql.replace('SELECT d.*,\n      p.name as project_name,\n      tc.title as testcase_title,\n      u1.real_name as creator_name,\n      u2.real_name as assignee_name', 'SELECT COUNT(*) as total');
  const countResult = db.queryOne(countSql, params);
  const total = countResult?.total || 0;

  sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const defects = db.queryAll(sql, params);

  res.json({
    list: defects,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

// 获取缺陷详情
router.get('/:id', authMiddleware, (req, res) => {
  const defect = db.queryOne(`
    SELECT d.*,
      p.name as project_name,
      tc.title as testcase_title,
      r.title as requirement_title,
      u1.real_name as creator_name,
      u2.real_name as assignee_name
    FROM defects d
    LEFT JOIN projects p ON d.project_id = p.id
    LEFT JOIN test_cases tc ON d.testcase_id = tc.id
    LEFT JOIN requirements r ON d.requirement_id = r.id
    LEFT JOIN users u1 ON d.creator_id = u1.id
    LEFT JOIN users u2 ON d.assignee_id = u2.id
    WHERE d.id = ?
  `, [req.params.id]);

  if (!defect) {
    return res.status(404).json({ message: '缺陷不存在' });
  }

  res.json(defect);
});

// 创建缺陷
router.post('/', authMiddleware, (req, res) => {
  const { project_id, testcase_id, requirement_id, title, description, severity, priority, assignee_id } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({ message: '项目和缺陷标题不能为空' });
  }

  const result = db.run(`
    INSERT INTO defects (project_id, testcase_id, requirement_id, title, description, severity, priority, assignee_id, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [project_id, testcase_id, requirement_id, title, description, severity || 'major', priority || 'medium', assignee_id, req.user.id]);

  res.status(201).json({
    message: '缺陷创建成功',
    id: result.lastInsertRowid
  });
});

// 更新缺陷
router.put('/:id', authMiddleware, (req, res) => {
  const { title, description, severity, priority, status, assignee_id, resolve_date } = req.body;

  const defect = db.queryOne('SELECT * FROM defects WHERE id = ?', [req.params.id]);
  if (!defect) {
    return res.status(404).json({ message: '缺陷不存在' });
  }

  db.run(`
    UPDATE defects
    SET title = ?, description = ?, severity = ?, priority = ?, status = ?, assignee_id = ?, resolve_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    title || defect.title,
    description || defect.description,
    severity || defect.severity,
    priority || defect.priority,
    status || defect.status,
    assignee_id !== undefined ? assignee_id : defect.assignee_id,
    resolve_date || defect.resolve_date,
    req.params.id
  ]);

  res.json({ message: '缺陷更新成功' });
});

// 删除缺陷
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM defects WHERE id = ?', [req.params.id]);
  res.json({ message: '缺陷删除成功' });
});

module.exports = router;
