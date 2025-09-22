use rusqlite::{Connection, Result};
use std::fmt;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log;

// 通用数据库操作包装函数
pub fn db_op<F, T, E>(op_name: &str, f: F) -> Result<T, E>
where
    F: FnOnce() -> Result<T, E>,
    E: fmt::Display + fmt::Debug,
{
    match f() {
        Ok(result) => {
            log::info!("数据库操作成功: {}", op_name);
            Ok(result)
        }
        Err(e) => {
            log::error!("数据库操作失败: {} - 错误: {}", op_name, e);
            log::debug!("错误详情: {:?}", e); // 更详细的调试信息
            Err(e)
        }
    }
}

// 获取数据库目录路径
fn get_db_directory(app: &AppHandle) -> Result<PathBuf, String> {
    // 获取应用数据目录
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;

    println!("App data directory: {:?}", data_dir);

    // 在应用数据目录下创建一个专门的数据库子目录
    let db_dir = data_dir.join("databases");

    // 确保目录存在
    std::fs::create_dir_all(&db_dir).map_err(|e| format!("无法创建数据库目录: {}", e))?;

    Ok(db_dir)
}

// 获取指定名称的数据库文件路径
fn get_db_path(app: &AppHandle, db_name: &str) -> Result<PathBuf, String> {
    let db_dir = get_db_directory(app)?;
    // 为数据库文件添加.db扩展名
    let db_filename = format!("{}.db", db_name);
    Ok(db_dir.join(db_filename))
}

// 初始化指定的数据库
pub fn init_database(app: &AppHandle, db_name: &str) -> Result<Connection, String> {
    // 获取指定数据库的路径
    let db_path = get_db_path(app, db_name)?;

    // 连接数据库（如果不存在会自动创建）
    let conn = Connection::open(db_path).map_err(|e| format!("无法打开数据库: {}", e))?;

    Ok(conn)
}
