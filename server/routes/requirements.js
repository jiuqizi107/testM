const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

// 获取需求列表
router.get('/', authMiddleware, (req, res) => {
  const { project_id, status, priority, keyword, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT r.*,
      p.name as project_name,
      u1.real_name as assignee_name,
      u2.real_name as submitter_name
    FROM requirements r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN users u1 ON r.assignee_id = u1.id
    LEFT JOIN users u2 ON r.submitter_id = u2.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    sql += ' AND r.project_id = ?';
    params.push(project_id);
  }

  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  if (priority) {
    sql += ' AND r.priority = ?';
    params.push(priority);
  }

  if (keyword) {
    sql += ' AND (r.title LIKE ? OR r.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const countSql = sql.replace('SELECT r.*,\n      p.name as project_name,\n      u1.real_name as assignee_name,\n      u2.real_name as submitter_name', 'SELECT COUNT(*) as total');
  const countResult = db.queryOne(countSql, params);
  const total = countResult?.total || 0;

  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const requirements = db.queryAll(sql, params);

  res.json({
    list: requirements,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

// 获取需求详情
router.get('/:id', authMiddleware, (req, res) => {
  const requirement = db.queryOne(`
    SELECT r.*,
      p.name as project_name,
      u1.real_name as assignee_name,
      u2.real_name as submitter_name
    FROM requirements r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN users u1 ON r.assignee_id = u1.id
    LEFT JOIN users u2 ON r.submitter_id = u2.id
    WHERE r.id = ?
  `, [req.params.id]);

  if (!requirement) {
    return res.status(404).json({ message: '需求不存在' });
  }

  // 获取关联的测试用例
  requirement.testCases = db.queryAll('SELECT * FROM test_cases WHERE requirement_id = ?', [req.params.id]);

  // 获取关联的缺陷
  requirement.defects = db.queryAll('SELECT * FROM defects WHERE requirement_id = ?', [req.params.id]);

  res.json(requirement);
});

// 创建需求
router.post('/', authMiddleware, (req, res) => {
  const { project_id, title, description, priority, assignee_id } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({ message: '项目和需求标题不能为空' });
  }

  const result = db.run(`
    INSERT INTO requirements (project_id, title, description, priority, assignee_id, submitter_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [project_id, title, description, priority || 'medium', assignee_id, req.user.id]);

  res.status(201).json({
    message: '需求创建成功',
    id: result.lastInsertRowid
  });
});

// 更新需求
router.put('/:id', authMiddleware, (req, res) => {
  const { title, description, priority, status, assignee_id, submit_test_date } = req.body;

  const requirement = db.queryOne('SELECT * FROM requirements WHERE id = ?', [req.params.id]);
  if (!requirement) {
    return res.status(404).json({ message: '需求不存在' });
  }

  db.run(`
    UPDATE requirements
    SET title = ?, description = ?, priority = ?, status = ?, assignee_id = ?, submit_test_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    title || requirement.title,
    description || requirement.description,
    priority || requirement.priority,
    status || requirement.status,
    assignee_id !== undefined ? assignee_id : requirement.assignee_id,
    submit_test_date || requirement.submit_test_date,
    req.params.id
  ]);

  res.json({ message: '需求更新成功' });
});

// 删除需求
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM requirements WHERE id = ?', [req.params.id]);
  res.json({ message: '需求删除成功' });
});

// 分配负责人
router.post('/:id/assign', authMiddleware, (req, res) => {
  const { assignee_id } = req.body;

  db.run('UPDATE requirements SET assignee_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [assignee_id, req.params.id]);

  // 创建任务分配记录
  db.run(`
    INSERT INTO task_assignments (requirement_id, assignee_id, task_type, status)
    VALUES (?, ?, 'test', 'pending')
  `, [req.params.id, assignee_id]);

  res.json({ message: '分配成功' });
});

module.exports = router;
