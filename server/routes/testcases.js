const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

// 获取测试用例列表
router.get('/', authMiddleware, (req, res) => {
  const { project_id, requirement_id, status, priority, keyword, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT tc.*,
      p.name as project_name,
      r.title as requirement_title,
      u.real_name as creator_name
    FROM test_cases tc
    LEFT JOIN projects p ON tc.project_id = p.id
    LEFT JOIN requirements r ON tc.requirement_id = r.id
    LEFT JOIN users u ON tc.creator_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    sql += ' AND tc.project_id = ?';
    params.push(project_id);
  }

  if (requirement_id) {
    sql += ' AND tc.requirement_id = ?';
    params.push(requirement_id);
  }

  if (status) {
    sql += ' AND tc.status = ?';
    params.push(status);
  }

  if (priority) {
    sql += ' AND tc.priority = ?';
    params.push(priority);
  }

  if (keyword) {
    sql += ' AND (tc.title LIKE ? OR tc.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const countSql = sql.replace('SELECT tc.*,\n      p.name as project_name,\n      r.title as requirement_title,\n      u.real_name as creator_name', 'SELECT COUNT(*) as total');
  const countResult = db.queryOne(countSql, params);
  const total = countResult?.total || 0;

  sql += ' ORDER BY tc.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const testcases = db.queryAll(sql, params);

  res.json({
    list: testcases,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

// 获取测试用例详情
router.get('/:id', authMiddleware, (req, res) => {
  const testcase = db.queryOne(`
    SELECT tc.*,
      p.name as project_name,
      r.title as requirement_title,
      u1.real_name as creator_name,
      u2.real_name as executor_name
    FROM test_cases tc
    LEFT JOIN projects p ON tc.project_id = p.id
    LEFT JOIN requirements r ON tc.requirement_id = r.id
    LEFT JOIN users u1 ON tc.creator_id = u1.id
    LEFT JOIN users u2 ON tc.executor_id = u2.id
    WHERE tc.id = ?
  `, [req.params.id]);

  if (!testcase) {
    return res.status(404).json({ message: '测试用例不存在' });
  }

  res.json(testcase);
});

// 创建测试用例
router.post('/', authMiddleware, (req, res) => {
  const { project_id, requirement_id, title, description, pre_condition, steps, expected_result, priority } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({ message: '项目和用例标题不能为空' });
  }

  const result = db.run(`
    INSERT INTO test_cases (project_id, requirement_id, title, description, pre_condition, steps, expected_result, priority, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [project_id, requirement_id, title, description, pre_condition, steps, expected_result, priority || 'medium', req.user.id]);

  res.status(201).json({
    message: '测试用例创建成功',
    id: result.lastInsertRowid
  });
});

// 更新测试用例
router.put('/:id', authMiddleware, (req, res) => {
  const { title, description, pre_condition, steps, expected_result, priority, status, executor_id } = req.body;

  const testcase = db.queryOne('SELECT * FROM test_cases WHERE id = ?', [req.params.id]);
  if (!testcase) {
    return res.status(404).json({ message: '测试用例不存在' });
  }

  db.run(`
    UPDATE test_cases
    SET title = ?, description = ?, pre_condition = ?, steps = ?, expected_result = ?, priority = ?, status = ?, executor_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    title || testcase.title,
    description || testcase.description,
    pre_condition || testcase.pre_condition,
    steps || testcase.steps,
    expected_result || testcase.expected_result,
    priority || testcase.priority,
    status || testcase.status,
    executor_id || testcase.executor_id,
    req.params.id
  ]);

  res.json({ message: '测试用例更新成功' });
});

// 删除测试用例
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM test_cases WHERE id = ?', [req.params.id]);
  res.json({ message: '测试用例删除成功' });
});

module.exports = router;
