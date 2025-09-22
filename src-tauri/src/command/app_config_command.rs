use crate::db::app_config_db;
use crate::db::common::init_database;
use tauri::command;
use tauri::AppHandle;
// 保存 Cookie 命令（前端调用）
#[command]
pub fn save_xueqiu_cookie(app: AppHandle, cookie: String) -> Result<(), String> {
    // 获取数据库连接

    let mut conn =
        init_database(&app, "app_config").map_err(|e| format!("获取数据库连接失败: {}", e))?;
    println!("Database connection established.");
    // 保存到数据库
    app_config_db::save_xueqiu_cookie_to_db(&mut conn, &cookie)
        .map_err(|e| format!("保存 Cookie 失败: {}", e))?;
    println!("Saved cookie: {}", cookie);

    Ok(())
}

pub fn get_xueqiu_cookie(app: AppHandle) -> Result<Option<String>, String> {
    let conn =
        init_database(&app, "app_config").map_err(|e| format!("获取数据库连接失败: {}", e))?;

    // 从数据库读取
    app_config_db::get_xueqiu_cookie_from_db(&conn).map_err(|e| format!("读取 Cookie 失败: {}", e))
}
