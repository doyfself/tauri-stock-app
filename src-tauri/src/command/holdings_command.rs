use crate::db::holdings_db::{
    add_holding, query_history_holdings, query_holdings, query_latest_holding_by_code,
    update_holding,
};
use crate::structs::holdings_structs::{AddHoldingReq, QueryHistoryParams, UpdateHoldingReq};
use serde_json;
use tauri::command;
use tauri::AppHandle;

// --------------------------
// 1. 获取所有当前持仓 Command
// --------------------------
#[command]
pub fn get_all_holdings_cmd(app: AppHandle) -> Result<serde_json::Value, String> {
    match query_holdings(&app) {
        Ok(holdings) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功获取 {} 条持仓数据", holdings.len()),
            "data": holdings,
            "count": holdings.len()
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("获取持仓失败: {}", e),
            "data": [],
            "count": 0
        })),
    }
}

// --------------------------
// 2. 获取历史持仓记录 Command
// --------------------------// --------------------------
// 2. 获取历史持仓记录 Command（带分页）
// --------------------------
#[command]
pub fn get_history_holdings_cmd(
    app: AppHandle,
    params: QueryHistoryParams,
) -> Result<serde_json::Value, String> {
    match query_history_holdings(&app, params.page, params.page_size) {
        Ok(paged_result) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功获取历史持仓数据，第 {} 页，共 {} 条", params.page, paged_result.total),
            "data": paged_result.data,
            "count":paged_result.total
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("获取历史持仓失败: {}", e),
            "data": [],
            "count": 0
        })),
    }
}

// --------------------------
// 3. 添加持仓 Command
// --------------------------
#[command]
pub fn add_holding_cmd(app: AppHandle, params: AddHoldingReq) -> Result<serde_json::Value, String> {
    match add_holding(&app, &params) {
        Ok(id) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功添加持仓，持仓ID: {}", id),
            "data": id,
            "count": 1
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("添加持仓失败: {}", e),
            "data": 0,
            "count": 0
        })),
    }
}

// --------------------------
// 4. 更新持仓 Command
// --------------------------
#[command]
pub fn update_holding_cmd(
    app: AppHandle,
    params: UpdateHoldingReq,
) -> Result<serde_json::Value, String> {
    match update_holding(&app, &params) {
        Ok(true) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功更新持仓ID「{}」的数据", params.id),
            "data": true,
            "count": 1
        })),
        Ok(false) => Ok(serde_json::json!({
            "success": false,
            "message": format!("未找到持仓ID「{}」的数据，更新失败", params.id),
            "data": false,
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("更新持仓失败: {}", e),
            "data": false,
            "count": 0
        })),
    }
}

// --------------------------
// 7. 根据股票代码获取最近持仓数据 Command
// --------------------------
#[command]
pub fn get_latest_holding_by_code_cmd(
    app: AppHandle,
    code: String,
) -> Result<serde_json::Value, String> {
    match query_latest_holding_by_code(&app, &code) {
        Ok(Some(holding)) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功获取股票 {} 的最近持仓数据", code),
            "data": holding,
            "count": 1
        })),
        Ok(None) => Ok(serde_json::json!({
            "success": true,
            "message": format!("股票 {} 没有找到持仓记录", code),
            "data": null,
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("获取股票 {} 的持仓数据失败: {}", code, e),
            "data": null,
            "count": 0
        })),
    }
}
