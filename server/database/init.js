const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'test_platform.db');

let db = null;

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs();

  // 尝试加载现有数据库
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'tester', -- admin/test_manager/test_leader/tester/viewer
      department TEXT, -- 部门，如：测试一组、测试二组
      position TEXT, -- 岗位，如：主管、组长、组员
      avatar TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建用户项目权限关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_project_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member', -- owner/member/viewer
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // 创建用户版本权限关联表（日常需求测试用）
  db.run(`
    CREATE TABLE IF NOT EXISTS user_version_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member', -- owner/member/viewer
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `);

  // 创建项目表（扩展）
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT,
      name TEXT NOT NULL,
      description TEXT,
      system_id INTEGER,
      system_name TEXT,
      project_manager TEXT,
      test_status TEXT DEFAULT 'pending',
      submit_test_date DATE,
      sys_test_start_date DATE,
      sys_test_end_date DATE,
      production_date DATE,
      test_leader TEXT,
      requirement_doc TEXT,
      design_doc TEXT,
      milestone_plan TEXT,
      test_plan TEXT,
      status TEXT DEFAULT 'active',
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (system_id) REFERENCES system_dictionary(id)
    )
  `);

  // 创建系统字典表
  db.run(`
    CREATE TABLE IF NOT EXISTS system_dictionary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_name TEXT NOT NULL,
      system_code TEXT UNIQUE NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      creator_id INTEGER,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建需求表（扩展）
  db.run(`
    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER, -- 项目类测试时关联项目，日常需求测试时不关联
      version_id INTEGER, -- 关联版本，日常需求测试时使用
      title TEXT NOT NULL,
      description TEXT,
      requirement_code TEXT,
      source TEXT,
      requirement_type TEXT,
      business_department TEXT,
      product_manager TEXT,
      dev_leader TEXT,
      test_leader TEXT,
      propose_date DATE,
      plan_submit_test_date DATE,
      actual_submit_test_date DATE,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      assignee_id INTEGER,
      submitter_id INTEGER,
      submit_test_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (version_id) REFERENCES versions(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (submitter_id) REFERENCES users(id)
    )
  `);

  // 创建版本表（扩展）
  db.run(`
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      name TEXT NOT NULL,
      version_code TEXT,
      test_type TEXT DEFAULT 'daily', -- 'project' 项目类测试, 'daily' 日常需求测试
      requirement_ids TEXT,
      requirement_names TEXT,
      requirement_count INTEGER DEFAULT 0,
      testcase_count INTEGER DEFAULT 0,
      first_submit_test_date DATE,
      sys_test_start_date DATE,
      sys_test_end_date DATE,
      sys_test_duration INTEGER DEFAULT 0,
      acceptance_test_start_date DATE,
      acceptance_test_end_date DATE,
      acceptance_test_duration INTEGER DEFAULT 0,
      plan_production_date DATE,
      production_date DATE,
      test_leader TEXT,
      submit_to_production_duration INTEGER DEFAULT 0,
      return_count INTEGER DEFAULT 0,
      sys_test_round INTEGER DEFAULT 1,
      test_status TEXT DEFAULT 'pending', -- pending/assigned/testing/completed/accepted/returned
      description TEXT,
      status TEXT DEFAULT 'developing',
      release_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // 创建退回台账表
  db.run(`
    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER NOT NULL,
      version_id INTEGER,
      reason TEXT NOT NULL,
      return_date DATE DEFAULT CURRENT_TIMESTAMP,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES requirements(id),
      FOREIGN KEY (version_id) REFERENCES versions(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    )
  `);

  // 创建测试用例表（按需求文档模板设计）
  db.run(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER, -- 项目类测试时使用
      version_id INTEGER, -- 日常需求测试时使用
      requirement_id INTEGER,
      test_type TEXT DEFAULT 'daily', -- 'project' 项目类测试, 'daily' 日常需求
      case_code TEXT, -- 用例编号 TC_ALS_REQ20250339_0001 格式
      case_title TEXT NOT NULL, -- 用例标题
      test_module TEXT, -- 测试模块/阶段
      test_purpose TEXT, -- 测试目的
      pre_condition TEXT, -- 预置条件
      test_steps TEXT, -- 操作步骤
      expected_result TEXT, -- 预期结果
      priority TEXT DEFAULT 'P2', -- P1/P2/P3/P4
      status TEXT DEFAULT 'draft', -- draft/reviewing/approved/executed
      review_status TEXT DEFAULT 'pending', -- pending/approved/rejected 项目类测试评审用
      execution_result TEXT, -- P(通过)/F(失败)/NA(不适用)/N(未测)
      bug_id TEXT, -- 关联缺陷ID
      executor_id INTEGER,
      creator_id INTEGER,
      test_result_summary TEXT, -- 用例统计汇总
      remarks TEXT, -- 备注
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (version_id) REFERENCES versions(id),
      FOREIGN KEY (requirement_id) REFERENCES requirements(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建缺陷表
  db.run(`
    CREATE TABLE IF NOT EXISTS defects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      testcase_id INTEGER,
      requirement_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT DEFAULT 'major',
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'new',
      assignee_id INTEGER,
      creator_id INTEGER,
      resolve_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (testcase_id) REFERENCES test_cases(id),
      FOREIGN KEY (requirement_id) REFERENCES requirements(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建任务分配表
  db.run(`
    CREATE TABLE IF NOT EXISTS task_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER NOT NULL,
      assignee_id INTEGER NOT NULL,
      task_type TEXT DEFAULT 'test',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES requirements(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    )
  `);

  // 创建退回记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS return_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER,
      requirement_id INTEGER,
      submit_test_date DATE,
      return_reason TEXT NOT NULL,
      return_date DATE,
      resubmit_date DATE,
      status TEXT DEFAULT 'returned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      creator_id INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (version_id) REFERENCES versions(id),
      FOREIGN KEY (requirement_id) REFERENCES requirements(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建系统投产后问题复盘表
  db.run(`
    CREATE TABLE IF NOT EXISTS post_production_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER,
      issue_description TEXT NOT NULL,
      issue_category TEXT,
      severity TEXT DEFAULT 'minor',
      discovery_time DATETIME,
      processing_status TEXT DEFAULT 'pending',
      resolve_date DATE,
      root_cause_analysis TEXT,
      improvement_measures TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      creator_id INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (version_id) REFERENCES versions(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建测试室周报表
  db.run(`
    CREATE TABLE IF NOT EXISTS weekly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date DATE NOT NULL,
      week_number INTEGER,
      year INTEGER,
      completed_tests TEXT,
      next_week_plans TEXT,
      test_resources TEXT,
      issues_and_risks TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      creator_id INTEGER,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建个人日报表
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_date DATE NOT NULL,
      work_content TEXT,
      issues TEXT,
      tomorrow_plan TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建测试资产表（用例库和经验库）
  db.run(`
    CREATE TABLE IF NOT EXISTS test_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT NOT NULL, -- 'case' 用例, 'experience' 经验
      title TEXT NOT NULL,
      content TEXT,
      system_name TEXT,
      module_name TEXT,
      tags TEXT,
      status TEXT DEFAULT 'active',
      creator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建测试经验复盘表
  db.run(`
    CREATE TABLE IF NOT EXISTS test_experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      version_id INTEGER,
      title TEXT NOT NULL,
      experience_type TEXT, -- 'test_method', 'problem_solve', 'risk_point', 'best_practice'
      content TEXT,
      problem_description TEXT,
      solution TEXT,
      lessons_learned TEXT,
      creator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (version_id) REFERENCES versions(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 初始化默认管理员账号
  const adminExists = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    run('INSERT INTO users (username, password, real_name, email, role, department, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['admin', hashedPassword, '管理员', 'admin@example.com', 'admin', '科技部', '系统管理员']);

    // 添加测试室主管
    run('INSERT INTO users (username, password, real_name, email, role, department, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['manager', hashedPassword, '刘震', 'manager@example.com', 'test_manager', '测试室', '主管']);

    // 添加测试组长
    run('INSERT INTO users (username, password, real_name, email, role, department, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['leader1', hashedPassword, '刘娜娜', 'leader1@example.com', 'test_leader', '测试室', '测试组长']);

    run('INSERT INTO users (username, password, real_name, email, role, department, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['leader2', hashedPassword, '宋富涛', 'leader2@example.com', 'test_leader', '测试室', '测试组长']);

    // 添加测试组员
    const testerPassword = bcrypt.hashSync('tester123', 10);
    run('INSERT INTO users (username, password, real_name, email, role, department, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['tester1', testerPassword, '许晔', 'tester1@example.com', 'tester', '测试室', '测试工程师']);

    run('INSERT INTO users (username, password, real_name, email, role, department, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['tester2', testerPassword, '杨晗', 'tester2@example.com', 'tester', '测试室', '测试工程师']);

    run('INSERT INTO users (username, password, real_name, email, role, department, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['tester3', testerPassword, '周炳睿', 'tester3@example.com', 'tester', '测试室', '测试工程师']);

    console.log('默认用户已创建');
  }

  // 初始化示例数据
  const projectExists = queryOne('SELECT id FROM projects LIMIT 1');
  if (!projectExists) {
    // 创建示例项目
    const projectResult = run(
      'INSERT INTO projects (name, description, status, owner_id) VALUES (?, ?, ?, ?)',
      ['电商平台项目', '电商交易平台测试项目', 'active', 1]
    );

    const projectId = projectResult.lastInsertRowid;

    // 创建示例需求
    run('INSERT INTO requirements (project_id, title, description, priority, status, assignee_id, submitter_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, '用户登录功能', '实现用户登录功能，支持账号密码和手机验证码登录', 'high', 'testing', 2, 1]);

    run('INSERT INTO requirements (project_id, title, description, priority, status, assignee_id, submitter_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, '商品搜索功能', '实现商品搜索功能，支持关键词和分类筛选', 'medium', 'pending', 3, 1]);

    run('INSERT INTO requirements (project_id, title, description, priority, status, assignee_id, submitter_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, '订单管理功能', '实现订单创建、查询、取消等功能', 'high', 'submitted', 2, 1]);

    // 创建示例版本
    run('INSERT INTO versions (project_id, name, test_type, description, status) VALUES (?, ?, ?, ?, ?)',
      [projectId, 'v1.0.0', 'project', '首版发布', 'released']);

    run('INSERT INTO versions (project_id, name, test_type, description, status) VALUES (?, ?, ?, ?, ?)',
      [projectId, 'v1.1.0', 'project', '功能优化版本', 'developing']);

    // 创建示例测试用例（项目类测试）
    run('INSERT INTO test_cases (project_id, test_type, case_code, case_title, test_module, test_purpose, pre_condition, test_steps, expected_result, priority, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, 'project', 'TC_PROJ_001', '登录功能测试-正常登录', '用户登录', '验证用户正常登录流程',
        '系统正常运行', '1. 打开登录页面\n2. 输入正确的用户名和密码\n3. 点击登录按钮',
        '登录成功，跳转到首页', 'P1', 'passed', 2]);

    run('INSERT INTO test_cases (project_id, test_type, case_code, case_title, test_module, test_purpose, pre_condition, test_steps, expected_result, priority, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, 'project', 'TC_PROJ_002', '登录功能测试-密码错误', '用户登录', '验证密码错误场景',
        '系统正常运行', '1. 打开登录页面\n2. 输入正确的用户名和错误密码\n3. 点击登录按钮',
        '提示密码错误', 'P1', 'passed', 2]);

    run('INSERT INTO test_cases (project_id, test_type, case_code, case_title, test_module, test_purpose, pre_condition, test_steps, expected_result, priority, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, 'project', 'TC_PROJ_003', '商品搜索测试', '商品模块', '验证商品搜索功能',
        '商品数据已存在', '1. 进入商品列表页\n2. 输入搜索关键词\n3. 点击搜索',
        '显示匹配的商品列表', 'P2', 'draft', 3]);

    // 创建示例缺陷
    run('INSERT INTO defects (project_id, title, description, severity, priority, status, assignee_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, '登录页面验证码不显示', '在某些浏览器下，验证码图片无法正常显示', 'major', 'high', 'new', 2, 3]);

    run('INSERT INTO defects (project_id, title, description, severity, priority, status, assignee_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, '搜索结果分页异常', '搜索结果超过100条时，分页显示异常', 'minor', 'medium', 'resolved', 3, 2]);

    console.log('示例数据已创建');
  }

  saveDatabase();
  console.log('数据库初始化完成');
}

// 保存数据库到文件
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// 执行SQL语句
function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  const result = {
    lastInsertRowid: getlastInsertRowId(),
    changes: getChanges()
  };
  return result;
}

function getlastInsertRowId() {
  const row = db.exec('SELECT last_insert_rowid() as id');
  return row[0]?.values[0]?.[0] || 0;
}

function getChanges() {
  const row = db.exec('SELECT changes() as count');
  return row[0]?.values[0]?.[0] || 0;
}

// 查询单条记录
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// 查询多条记录
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// 导出数据库实例和初始化函数
module.exports = {
  initDatabase,
  run,
  queryOne,
  queryAll,
  saveDatabase
};
