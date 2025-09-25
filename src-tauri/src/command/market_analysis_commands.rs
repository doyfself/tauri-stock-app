use crate::db::market_analysis_db::{add_or_update_market_analysis, query_last_10_market_analysis};
use crate::structs::market_analysis_structs::AddMarketAnalysisReq;
use chrono::NaiveDate;
use serde_json;
use tauri::command;
use tauri::AppHandle;

// --------------------------
// 1. 新增/更新市场分析 Command（适配 status 字段 + 显式判断日期）
// --------------------------
#[command]
pub fn add_market_analysis_cmd(
    app: AppHandle,
    req: AddMarketAnalysisReq,
) -> Result<serde_json::Value, String> {
    // 1. 参数校验：必填字段非空（新增 status 字段校验）
    let mut error_msgs = Vec::new();
    if req.date.is_empty() {
        error_msgs.push("日期（date）不能为空");
    }
    if req.analysis.is_empty() {
        error_msgs.push("分析内容（analysis）不能为空");
    }
    if req.status.is_empty() {
        error_msgs.push("状态（status）不能为空（如：draft/published）");
    }

    // 2. 日期格式校验（确保是 YYYY-MM-DD 格式）
    if !req.date.is_empty() {
        match NaiveDate::parse_from_str(&req.date, "%Y-%m-%d") {
            Err(_) => error_msgs.push("日期格式无效，需符合 YYYY-MM-DD（如 2024-10-01）"),
            Ok(_) => {}
        }
    }

    // 3. 有错误则返回所有校验失败信息
    if !error_msgs.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": error_msgs.join("；"),
            "data": null, // 错误时返回 null 更合理，避免前端误解为有效数据
            "count": 0
        }));
    }

    // 4. 调用数据库方法（显式判断日期存在性，存在则更新，不存在则新增）
    match add_or_update_market_analysis(&app, &req) {
        Ok((is_update, updated_analysis)) => {
            let operation = if is_update { "更新" } else { "新增" };
            Ok(serde_json::json!({
                "success": true,
                "message": format!("市场分析{}成功（日期：{}）", operation, updated_analysis.date),
                "data": updated_analysis, // 返回完整数据（含 date/analysis/status），便于前端同步
                "count": 1
            }))
        }
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("市场分析{}失败：{}", if req.date.is_empty() { "操作" } else { "新增/更新" }, e),
            "data": null,
            "count": 0
        })),
    }
}

// --------------------------
// 2. 查询最后10条市场分析 Command（替换原查询最后1条逻辑）
// --------------------------
#[command]
pub fn query_market_analysis_cmd(app: AppHandle) -> Result<serde_json::Value, String> {
    match query_last_10_market_analysis(&app) {
        // 修复点1：匹配 Option<Vec> 的 Some 分支，提取内部的 Vec
        Ok(Some(analysis_list)) => {
            let count = analysis_list.len(); // 正确：对 Vec 调用 len()
            Ok(serde_json::json!({
                "success": true,
                "message": format!("成功查询到 {} 条市场分析数据（最多返回10条，按日期倒序）", count),
                "data": analysis_list, // 返回 Vec 数组
                "count": count
            }))
        }
        // 修复点2：匹配 Option 的 None 分支（无数据）
        Ok(None) => Ok(serde_json::json!({
            "success": true,
            "message": "暂无市场分析数据",
            "data": [], // 返回空数组，符合前端处理习惯
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("市场分析查询失败：{}", e),
            "data": [],
            "count": 0
        })),
    }
}
