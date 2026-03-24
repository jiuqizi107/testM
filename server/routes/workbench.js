const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

// 获取工作台数据
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;

  // 我的待办需求
  const myRequirements = db.queryAll(`
    SELECT r.*, p.name as project_name
    FROM requirements r
    LEFT JOIN projects p ON r.project_id = p.id
    WHERE r.assignee_id = ? AND r.status NOT IN ('completed', 'closed')
    ORDER BY r.created_at DESC
    LIMIT 10
  `, [userId]);

  // 我的测试用例
  const myTestCases = db.queryAll(`
    SELECT tc.*, p.name as project_name
    FROM test_cases tc
    LEFT JOIN projects p ON tc.project_id = p.id
    WHERE tc.creator_id = ?
    ORDER BY tc.created_at DESC
    LIMIT 10
  `, [userId]);

  // 待处理的缺陷
  const myDefects = db.queryAll(`
    SELECT d.*, p.name as project_name
    FROM defects d
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.assignee_id = ? AND d.status NOT IN ('resolved', 'closed')
    ORDER BY d.created_at DESC
    LIMIT 10
  `, [userId]);

  // 我创建的缺陷
  const createdDefects = db.queryAll(`
    SELECT d.*, p.name as project_name
    FROM defects d
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.creator_id = ?
    ORDER BY d.created_at DESC
    LIMIT 5
  `, [userId]);

  res.json({
    myRequirements,
    myTestCases,
    myDefects,
    createdDefects
  });
});

// 获取统计数据
router.get('/stats', authMiddleware, (req, res) => {
  const userId = req.user.id;

  // 个人统计
  const myPendingRequirements = db.queryOne(`
    SELECT COUNT(*) as count FROM requirements
    WHERE assignee_id = ? AND status NOT IN ('completed', 'closed')
  `, [userId])?.count || 0;

  const myTestCasesCount = db.queryOne(`
    SELECT COUNT(*) as count FROM test_cases WHERE creator_id = ?
  `, [userId])?.count || 0;

  const myPendingDefects = db.queryOne(`
    SELECT COUNT(*) as count FROM defects
    WHERE assignee_id = ? AND status NOT IN ('resolved', 'closed')
  `, [userId])?.count || 0;

  // 全局统计（仪表盘）
  const totalProjects = db.queryOne('SELECT COUNT(*) as count FROM projects WHERE status = "active"')?.count || 0;
  const totalRequirements = db.queryOne('SELECT COUNT(*) as count FROM requirements')?.count || 0;
  const totalTestCases = db.queryOne('SELECT COUNT(*) as count FROM test_cases')?.count || 0;
  const totalDefects = db.queryOne('SELECT COUNT(*) as count FROM defects')?.count || 0;

  // 需求状态分布
  const requirementStatus = db.queryAll(`
    SELECT status, COUNT(*) as count FROM requirements GROUP BY status
  `);

  // 缺陷严重程度分布
  const defectSeverity = db.queryAll(`
    SELECT severity, COUNT(*) as count FROM defects GROUP BY severity
  `);

  // 缺陷状态分布
  const defectStatus = db.queryAll(`
    SELECT status, COUNT(*) as count FROM defects GROUP BY status
  `);

  // 测试用例状态分布
  const testcaseStatus = db.queryAll(`
    SELECT status, COUNT(*) as count FROM test_cases GROUP BY status
  `);

  res.json({
    personal: {
      pendingRequirements: myPendingRequirements,
      testCasesCount: myTestCasesCount,
      pendingDefects: myPendingDefects
    },
    global: {
      totalProjects,
      totalRequirements,
      totalTestCases,
      totalDefects
    },
    charts: {
      requirementStatus,
      defectSeverity,
      defectStatus,
      testcaseStatus
    }
  });
});

module.exports = router;
