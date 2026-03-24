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
      role TEXT DEFAULT 'tester',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建项目表
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // 创建需求表
  db.run(`
    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      assignee_id INTEGER,
      submitter_id INTEGER,
      submit_test_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (submitter_id) REFERENCES users(id)
    )
  `);

  // 创建版本表
  db.run(`
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'developing',
      release_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

  // 创建测试用例表
  db.run(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      requirement_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      pre_condition TEXT,
      steps TEXT,
      expected_result TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'draft',
      executor_id INTEGER,
      creator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
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

  // 初始化默认管理员账号
  const adminExists = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    run('INSERT INTO users (username, password, real_name, email, role) VALUES (?, ?, ?, ?, ?)',
      ['admin', hashedPassword, '管理员', 'admin@example.com', 'admin']);

    // 添加测试用户
    const testerPassword = bcrypt.hashSync('tester123', 10);
    run('INSERT INTO users (username, password, real_name, email, role) VALUES (?, ?, ?, ?, ?)',
      ['tester1', testerPassword, '测试员张三', 'tester1@example.com', 'tester']);

    run('INSERT INTO users (username, password, real_name, email, role) VALUES (?, ?, ?, ?, ?)',
      ['tester2', testerPassword, '测试员李四', 'tester2@example.com', 'tester']);

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
    run('INSERT INTO versions (project_id, name, description, status) VALUES (?, ?, ?, ?)',
      [projectId, 'v1.0.0', '首版发布', 'released']);

    run('INSERT INTO versions (project_id, name, description, status) VALUES (?, ?, ?, ?)',
      [projectId, 'v1.1.0', '功能优化版本', 'developing']);

    // 创建示例测试用例
    run('INSERT INTO test_cases (project_id, title, description, steps, expected_result, priority, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, '登录功能测试-正常登录', '测试用户正常登录流程',
        '1. 打开登录页面\n2. 输入正确的用户名和密码\n3. 点击登录按钮',
        '登录成功，跳转到首页', 'high', 'passed', 2]);

    run('INSERT INTO test_cases (project_id, title, description, steps, expected_result, priority, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, '登录功能测试-密码错误', '测试密码错误场景',
        '1. 打开登录页面\n2. 输入正确的用户名和错误密码\n3. 点击登录按钮',
        '提示密码错误', 'high', 'passed', 2]);

    run('INSERT INTO test_cases (project_id, title, description, steps, expected_result, priority, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, '商品搜索测试', '测试商品搜索功能',
        '1. 进入商品列表页\n2. 输入搜索关键词\n3. 点击搜索',
        '显示匹配的商品列表', 'medium', 'draft', 3]);

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
