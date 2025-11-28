use crate::db::init_db::{
    init_all_stocks_database, init_app_config_database, init_holdings_database,
    init_market_analysis_database, init_my_selection_database, init_orders_database,
    init_self_reflect_database, init_stock_review_database, init_trend_lines_database,
};
use rusqlite::{params, Connection, Result};
use tauri::AppHandle;

// 导入单个数据库
pub fn import_single_database(
    app: &AppHandle,
    db_name: &str,
    db_data: &[u8],
) -> Result<(), String> {
    // 创建临时数据库文件
    let temp_dir = tempfile::tempdir().map_err(|e| format!("创建临时目录失败: {}", e))?;
    let temp_db_path = temp_dir.path().join(format!("temp_{}.db", db_name));

    // 写入数据库数据到临时文件
    std::fs::write(&temp_db_path, db_data).map_err(|e| format!("写入临时数据库文件失败: {}", e))?;

    // 连接到临时数据库（备份数据库）
    let backup_conn =
        Connection::open(&temp_db_path).map_err(|e| format!("打开备份数据库失败: {}", e))?;

    // 连接到当前数据库 - 使用可变绑定
    let mut current_conn = match db_name {
        "app_config" => init_app_config_database(app),
        "all_stocks" => init_all_stocks_database(app),
        "my_selection" => init_my_selection_database(app),
        "stock_review" => init_stock_review_database(app),
        "self_reflect" => init_self_reflect_database(app),
        "market_analysis" => init_market_analysis_database(app),
        "trend_lines" => init_trend_lines_database(app),
        "holdings" => init_holdings_database(app),
        "orders" => init_orders_database(app),
        _ => return Err(format!("未知的数据库类型: {}", db_name)),
    }?;

    // 根据数据库类型执行不同的导入逻辑
    match db_name {
        "app_config" => import_app_config_data(&mut current_conn, &backup_conn),
        "all_stocks" => import_all_stocks_data(&mut current_conn, &backup_conn),
        "my_selection" => import_my_selection_data(&mut current_conn, &backup_conn),
        "stock_review" => import_stock_review_data(&mut current_conn, &backup_conn),
        "self_reflect" => import_self_reflect_data(&mut current_conn, &backup_conn),
        "market_analysis" => import_market_analysis_data(&mut current_conn, &backup_conn),
        "trend_lines" => import_trend_lines_data(&mut current_conn, &backup_conn),
        "holdings" => import_holdings_data(&mut current_conn, &backup_conn),
        "orders" => import_orders_data(&mut current_conn, &backup_conn),
        _ => Ok(()),
    }
}

// 为每个数据库类型实现具体的导入函数 - 现在接受 &mut Connection
fn import_app_config_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn
        .prepare("SELECT key, value FROM app_config")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (key, value) = row.map_err(|e| format!("读取行数据失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)",
            params![key, value],
        )
        .map_err(|e| format!("插入数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}

fn import_all_stocks_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn
        .prepare("SELECT symbol, name FROM all_stocks")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (symbol, name) = row.map_err(|e| format!("读取行数据失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO all_stocks (symbol, name) VALUES (?, ?)",
            params![symbol, name],
        )
        .map_err(|e| format!("插入数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}

fn import_my_selection_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn
        .prepare("SELECT code, name, color, remark, sort FROM my_selection")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, i64>(4)?,
            ))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (code, name, color, remark, sort) =
            row.map_err(|e| format!("读取行数据失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO my_selection (code, name, color, remark, sort) VALUES (?, ?, ?, ?, ?)",
            params![code, name, color, remark, sort],
        ).map_err(|e| format!("插入数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}

fn import_stock_review_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn
        .prepare("SELECT id, title, code, date, type, description FROM stock_review")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<String>>(5)?,
            ))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (id, title, code, date, review_type, description) =
            row.map_err(|e| format!("读取行数据失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO stock_review (id, title, code, date, type, description) VALUES (?, ?, ?, ?, ?, ?)",
            params![id, title, code, date, review_type, description],
        ).map_err(|e| format!("插入数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}

fn import_self_reflect_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn
        .prepare("SELECT id, title, code, date, description FROM self_reflect")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<String>>(4)?,
            ))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (id, title, code, date, description) =
            row.map_err(|e| format!("读取行数据失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO self_reflect (id, title, code, date, description) VALUES (?, ?, ?, ?, ?)",
            params![id, title, code, date, description],
        ).map_err(|e| format!("插入数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}

fn import_market_analysis_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn
        .prepare("SELECT date, analysis, status FROM market_analysis")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (date, analysis, status) = row.map_err(|e| format!("读取行数据失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO market_analysis (date, analysis, status) VALUES (?, ?, ?)",
            params![date, analysis, status],
        )
        .map_err(|e| format!("插入数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}

fn import_trend_lines_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn
        .prepare("SELECT id, code, period, start_time, end_time, start_price, end_price FROM trend_lines")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?, // 时间戳字符串（如 "1717020800000"）
                row.get::<_, String>(4)?,
                row.get::<_, f64>(5)?,
                row.get::<_, f64>(6)?,
            ))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (id, code, period, start_time, end_time, start_price, end_price) =
            row.map_err(|e| format!("读取行数据失败: {}", e))?;

        tx.execute(
            "INSERT OR REPLACE INTO trend_lines (id, code, period, start_time, end_time, start_price, end_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![id, code, period, start_time, end_time, start_price, end_price],
        ).map_err(|e| format!("插入 trend_lines 数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}
fn import_holdings_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn.prepare("SELECT id, code, name, cost, quantity, hold_time, status, sell_time, sell_price, profit FROM holdings")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, Option<f64>>(8)?,
                row.get::<_, Option<f64>>(9)?,
            ))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (id, code, name, cost, quantity, hold_time, status, sell_time, sell_price, profit) =
            row.map_err(|e| format!("读取行数据失败: {}", e))?;

        tx.execute(
            "INSERT OR REPLACE INTO holdings (id, code, name, cost, quantity, hold_time, status, sell_time, sell_price, profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, code, name, cost, quantity, hold_time, status, sell_time, sell_price, profit],
        ).map_err(|e| format!("插入数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}

fn import_orders_data(
    current_conn: &mut Connection,
    backup_conn: &Connection,
) -> Result<(), String> {
    let mut stmt = backup_conn
        .prepare("SELECT id, code, name, time, quantity, cost, action FROM orders")
        .map_err(|e| format!("准备查询失败: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, f64>(5)?,
                row.get::<_, String>(6)?,
            ))
        })
        .map_err(|e| format!("查询备份数据失败: {}", e))?;

    let tx = current_conn
        .transaction()
        .map_err(|e| format!("开始事务失败: {}", e))?;

    for row in rows {
        let (id, code, name, time, quantity, cost, action) =
            row.map_err(|e| format!("读取行数据失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO orders (id, code, name, time, quantity, cost, action) VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![id, code, name, time, quantity, cost, action],
        ).map_err(|e| format!("插入数据失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;
    Ok(())
}
