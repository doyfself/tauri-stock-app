use crate::db::app_config_db;
use crate::structs::stock_structs::StockError;
use rusqlite::Connection;
use tauri::command;

fn get_db_connection() -> Result<Connection, StockError> {
    // 连接数据库（若不存在则创建）
    let mut conn = Connection::open("app_config.db")?;
    println!("Opened app_config database successfully.");
    // 初始化股票表（确保表存在）
    app_config_db::init_db(&mut conn)?;
    Ok(conn)
}
// 保存 Cookie 命令（前端调用）
#[command]
pub fn save_xueqiu_cookie(cookie: String) -> Result<(), String> {
    // 获取数据库连接
    let mut conn = get_db_connection().map_err(|e| format!("获取数据库连接失败: {}", e))?;

    println!("Received cookie: {}", cookie);
    // 保存到数据库
    app_config_db::save_xueqiu_cookie_to_db(&mut conn, &cookie)
        .map_err(|e| format!("保存 Cookie 失败: {}", e))?;

    Ok(())
}

// 读取 Cookie 命令（前端调用）
#[command]
pub fn get_xueqiu_cookie() -> Result<Option<String>, String> {
    // 获取数据库连接
    let conn = get_db_connection().map_err(|e| format!("获取数据库连接失败: {}", e))?;

    // 从数据库读取
    app_config_db::get_xueqiu_cookie_from_db(&conn).map_err(|e| format!("读取 Cookie 失败: {}", e))
}
