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

pub fn init_my_selection_database(app: &AppHandle) -> Result<Connection, String> {
    // 1. 调用通用初始化函数，获取数据库连接（确保数据库文件路径正确、目录存在）
    let conn = init_database(app, "my_selection")?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS my_selection (
            code TEXT PRIMARY KEY,       
            name TEXT NOT NULL,           
            color TEXT,                   
            remark TEXT,                  
            sort INTEGER DEFAULT 0        
        )",
        [], // 无参数，仅创建表结构
    )
    .map_err(|e| format!("无法创建 my_selection 表: {}", e))?;

    Ok(conn)
}

pub fn init_stock_review_database(app: &AppHandle) -> Result<Connection, String> {
    // 1. 调用通用初始化函数，获取数据库连接（确保 my_selection.db 文件路径正确、目录存在）
    let conn = init_database(app, "stock_review")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS stock_review (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 唯一自增ID（删除用）
            title TEXT NOT NULL,          
            code TEXT NOT NULL,           
            date TEXT NOT NULL,           
            type TEXT NOT NULL,           
            description TEXT              
        )",
        [], // 无参数，仅创建表结构
    )
    .map_err(|e| format!("无法创建 stock_review 表: {}", e))?;
    Ok(conn)
}

pub fn init_self_reflect_database(app: &AppHandle) -> Result<Connection, String> {
    // 1. 调用通用初始化函数，获取数据库连接（确保 my_selection.db 文件路径正确、目录存在）
    let conn = init_database(app, "self_reflect")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS self_reflect (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 唯一自增ID（删除用）
            title TEXT NOT NULL,          
            code TEXT NOT NULL,           
            date TEXT NOT NULL,           
            description TEXT              
        )",
        [], // 无参数，仅创建表结构
    )
    .map_err(|e| format!("无法创建 self_reflect 表: {}", e))?;
    Ok(conn)
}

pub fn init_market_analysis_database(app: &AppHandle) -> Result<Connection, String> {
    let conn = init_database(app, "market_analysis")?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS market_analysis (
            date TEXT PRIMARY KEY,   
            analysis TEXT NOT NULL,   
            status TEXT NOT NULL   
        
        )",
        [], // 无参数，仅创建表结构
    )
    .map_err(|e| format!("无法创建 market_analysis 表: {}", e))?;
    Ok(conn)
}

pub fn init_stock_lines_database(app: &AppHandle) -> Result<Connection, String> {
    // 初始化数据库连接，表文件名为"stock_lines"
    let conn = init_database(app, "stock_lines")?;

    // 根据CSV表头创建表结构，字段与LINE_HEADERS一一对应
    conn.execute(
        "CREATE TABLE IF NOT EXISTS stock_lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 唯一自增ID（删除用）
            code TEXT NOT NULL,                     -- 股票代码
            period TEXT NOT NULL,                   -- 周期（日线/周线等）
            y REAL NOT NULL,                       
            height REAL NOT NULL                    -- 线条高度
        )",
        [], // 无参数
    )
    .map_err(|e| format!("无法创建 stock_lines 表: {}", e))?;

    Ok(conn)
}
