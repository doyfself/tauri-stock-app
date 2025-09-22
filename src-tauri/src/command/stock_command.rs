use crate::db::common::init_database;
use crate::db::stock_db;
use crate::requests::get_all_stock;
use tauri::command;
use tauri::AppHandle;

// -------------------------- 2. Tauri 命令：爬取并保存所有股票 --------------------------
/// 前端调用此命令时，触发爬取 + 存储逻辑
#[command]
pub async fn crawl_and_save_stocks(app: AppHandle) -> Result<serde_json::Value, String> {
    // 1. 爬取所有股票数据
    let stocks = get_all_stock::crawl_all_stocks(app.clone())
        .await
        .map_err(|e| e.to_string())?;
    let total_count = stocks.len();

    if total_count == 0 {
        return Err("未爬取到任何股票数据".to_string());
    }
    println!("开始爬取数据");
    // 2. 存入数据库
    let mut conn =
        init_database(&app, "all_stocks").map_err(|e| format!("获取数据库连接失败: {}", e))?;
    let saved_count =
        stock_db::batch_upsert_stocks(&mut conn, &stocks).map_err(|e| e.to_string())?;

    // 3. 返回结果给前端（JSON 格式，包含总条数和成功条数）
    Ok(serde_json::json!({
        "success": true,
        "message": format!("成功爬取并保存 {} 条股票数据", saved_count),
        "total_crawled": total_count,
        "total_saved": saved_count
    }))
}

/// 模糊查询股票（仅需关键词，返回所有匹配结果）
#[command]
pub fn search_stocks_by_keyword(
    app: AppHandle,
    keyword: &str,
) -> Result<serde_json::Value, String> {
    // 简单验证关键词（可选，根据需求调整）
    if keyword.trim().is_empty() {
        return Err("查询关键词不能为空".to_string());
    }

    let conn =
        init_database(&app, "all_stocks").map_err(|e| format!("获取数据库连接失败: {}", e))?;

    // 执行模糊查询
    let stocks =
        stock_db::fuzzy_search_stocks_by_keyword(&conn, keyword).map_err(|e| e.to_string())?;

    // 构建返回结果
    Ok(serde_json::json!({
        "success": true,
        "data": stocks,
        "count": stocks.len(),  // 返回匹配到的总条数
        "message": format!("找到 {} 条匹配结果", stocks.len())
    }))
}
