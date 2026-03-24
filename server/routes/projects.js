const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

// 获取项目列表
router.get('/', authMiddleware, (req, res) => {
  const { status, keyword, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT p.*, u.real_name as owner_name
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }

  if (keyword) {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  // 获取总数
  const countSql = sql.replace('SELECT p.*, u.real_name as owner_name', 'SELECT COUNT(*) as total');
  const countResult = db.queryOne(countSql, params);
  const total = countResult?.total || 0;

  // 获取分页数据
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const projects = db.queryAll(sql, params);

  // 获取每个项目的统计信息
  projects.forEach(project => {
    const reqCount = db.queryOne('SELECT COUNT(*) as count FROM requirements WHERE project_id = ?', [project.id]);
    const tcCount = db.queryOne('SELECT COUNT(*) as count FROM test_cases WHERE project_id = ?', [project.id]);
    const dfCount = db.queryOne('SELECT COUNT(*) as count FROM defects WHERE project_id = ?', [project.id]);
    project.requirementCount = reqCount?.count || 0;
    project.testcaseCount = tcCount?.count || 0;
    project.defectCount = dfCount?.count || 0;
  });

  res.json({
    list: projects,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

// 获取项目详情
router.get('/:id', authMiddleware, (req, res) => {
  const project = db.queryOne(`
    SELECT p.*, u.real_name as owner_name
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `, [req.params.id]);

  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }

  // 获取统计信息
  const reqCount = db.queryOne('SELECT COUNT(*) as count FROM requirements WHERE project_id = ?', [project.id]);
  const tcCount = db.queryOne('SELECT COUNT(*) as count FROM test_cases WHERE project_id = ?', [project.id]);
  const dfCount = db.queryOne('SELECT COUNT(*) as count FROM defects WHERE project_id = ?', [project.id]);
  const unresolvedCount = db.queryOne('SELECT COUNT(*) as count FROM defects WHERE project_id = ? AND status NOT IN ("resolved", "closed")', [project.id]);

  project.requirementCount = reqCount?.count || 0;
  project.testcaseCount = tcCount?.count || 0;
  project.defectCount = dfCount?.count || 0;
  project.unresolvedDefectCount = unresolvedCount?.count || 0;

  res.json(project);
});

// 创建项目
router.post('/', authMiddleware, (req, res) => {
  const { name, description, owner_id } = req.body;

  if (!name) {
    return res.status(400).json({ message: '项目名称不能为空' });
  }

  const result = db.run(`
    INSERT INTO projects (name, description, owner_id)
    VALUES (?, ?, ?)
  `, [name, description, owner_id || req.user.id]);

  res.status(201).json({
    message: '项目创建成功',
    id: result.lastInsertRowid
  });
});

// 更新项目
router.put('/:id', authMiddleware, (req, res) => {
  const { name, description, status, owner_id } = req.body;

  const project = db.queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }

  db.run(`
    UPDATE projects
    SET name = ?, description = ?, status = ?, owner_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    name || project.name,
    description || project.description,
    status || project.status,
    owner_id || project.owner_id,
    req.params.id
  ]);

  res.json({ message: '项目更新成功' });
});

// 删除项目
router.delete('/:id', authMiddleware, (req, res) => {
  const project = db.queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }

  // 删除关联数据
  db.run('DELETE FROM requirements WHERE project_id = ?', [req.params.id]);
  db.run('DELETE FROM test_cases WHERE project_id = ?', [req.params.id]);
  db.run('DELETE FROM defects WHERE project_id = ?', [req.params.id]);
  db.run('DELETE FROM versions WHERE project_id = ?', [req.params.id]);
  db.run('DELETE FROM projects WHERE id = ?', [req.params.id]);

  res.json({ message: '项目删除成功' });
});

module.exports = router;
