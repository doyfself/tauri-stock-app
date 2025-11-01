use crate::db::holdings_db::{add_holding, delete_holding, query_holdings, update_holding};
use crate::structs::holdings_structs::{AddHoldingReq, DeleteHoldingReq, UpdateHoldingReq};
use serde_json;
use tauri::command;
use tauri::AppHandle;

// --------------------------
// 1. 获取所有持仓 Command
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
// 5. 添加持仓 Command
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
// 6. 更新持仓 Command
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
// 7. 删除持仓 Command
// --------------------------
#[command]
pub fn delete_holding_cmd(app: AppHandle, id: i32) -> Result<serde_json::Value, String> {
    let req = DeleteHoldingReq { id };

    match delete_holding(&app, &req) {
        Ok(true) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功删除持仓ID「{}」", id),
            "data": true,
            "count": 1
        })),
        Ok(false) => Ok(serde_json::json!({
            "success": false,
            "message": format!("未找到持仓ID「{}」，删除失败", id),
            "data": false,
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("删除持仓失败: {}", e),
            "data": false,
            "count": 0
        })),
    }
}
