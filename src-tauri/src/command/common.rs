use crate::db::init_db::{
    init_all_stocks_database, init_app_config_database, init_market_analysis_database,
    init_my_selection_database, init_self_reflect_database, init_stock_lines_database,
    init_stock_review_database,
};
use tauri::AppHandle;
// Tauri 命令 - 初始化所有数据库
#[tauri::command]
pub fn init_all_databases(app: &AppHandle) -> Result<(), String> {
    init_app_config_database(&app)?;
    init_all_stocks_database(&app)?;
    init_my_selection_database(&app)?;
    init_stock_review_database(&app)?;
    init_market_analysis_database(&app)?;
    init_stock_lines_database(&app)?;
    init_self_reflect_database(app)?;
    // 可以添加更多数据库的初始化...
    Ok(())
}
