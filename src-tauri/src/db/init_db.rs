use crate::db::common::init_database;
use rusqlite::{Connection, Result};
use tauri::AppHandle;
pub fn init_app_config_database(app: &AppHandle) -> Result<Connection, String> {
    let conn = init_database(app, "app_config")?;

    // 创建用户表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| format!("无法创建app_config表: {}", e))?;

    Ok(conn)
}

pub fn init_all_stocks_database(app: &AppHandle) -> Result<Connection, String> {
    let conn = init_database(app, "all_stocks")?;

    // 创建用户表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS all_stocks (
            symbol TEXT PRIMARY KEY,  -- 股票代码作为主键（避免重复）
            name TEXT NOT NULL       -- 股票名称
        )",
        [],
    )
    .map_err(|e| format!("无法创建app_config表: {}", e))?;

    Ok(conn)
}
