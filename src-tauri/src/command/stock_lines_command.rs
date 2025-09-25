use crate::db::stock_lines_db::{add_stock_line, delete_stock_line, query_stock_lines};
use crate::structs::stock_lines_structs::{AddLineReq, DeleteLineReq};
use serde_json;
use tauri::command;
use tauri::AppHandle;

// --------------------------
// 1. 新增线条 Command
// --------------------------
#[command]
pub fn add_stock_lines_cmd(
    app: AppHandle,
    reqs: Vec<AddLineReq>, // 接收线条数组，支持批量新增
) -> Result<serde_json::Value, String> {
    // 存储所有新增成功的ID和失败的线条
    let mut success_ids = Vec::new();
    let mut failed_lines = Vec::new();

    // 遍历数组，逐条处理
    for req in reqs {
        // 调用数据库方法新增
        match add_stock_line(&app, &req) {
            Ok(new_id) => {
                success_ids.push((new_id, req));
            }
            Err(e) => {
                failed_lines.push((req, format!("数据库操作失败：{}", e)));
            }
        }
    }

    // 组装返回结果
    let total = success_ids.len() + failed_lines.len();
    let success_count = success_ids.len();

    if success_count > 0 && failed_lines.is_empty() {
        // 全部成功
        Ok(serde_json::json!({
            "success": true,
            "message": format!("全部 {} 条线条新增成功", total),
            "data": true,
            "count": success_count
        }))
    } else if success_count > 0 && !failed_lines.is_empty() {
        // 部分成功
        Ok(serde_json::json!({
            "success": false,
            "message": format!("部分线条新增失败，成功 {} 条，失败 {} 条", success_count, failed_lines.len()),
            "data": true,
            "count": success_count
        }))
    } else {
        // 全部失败
        Ok(serde_json::json!({
            "success": false,
            "message": format!("全部 {} 条线条新增失败", total),
            "data": false,
            "count": 0
        }))
    }
}

// --------------------------
// 2. 查询线条 Command（按 code + period 筛选）
// --------------------------
#[command]
pub fn query_stock_lines_cmd(
    app: AppHandle,
    code: String,   // 股票代码（前端传递，如 "SH600000"）
    period: String, // 周期（前端传递，如 "day" "week"）
) -> Result<serde_json::Value, String> {
    // 基础参数校验
    if code.is_empty() || period.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "股票代码（code）和周期（period）为必填参数，不能为空",
            "data": [],
            "count": 0
        }));
    }

    match query_stock_lines(&app, &code, &period) {
        Ok(lines) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功查询到 {} 条线条数据（股票：{}，周期：{}）", lines.len(), code, period),
            "data": lines, // 直接返回独立字段的线条列表（无嵌套）
            "count": lines.len() // 数据条数
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("线条查询失败：{}", e),
            "data": [], // 失败时返回空列表
            "count": 0
        })),
    }
}

// --------------------------
// 3. 删除线条 Command（按唯一自增ID删除）
// --------------------------
#[command]
pub fn delete_stock_line_cmd(
    app: AppHandle,
    req: DeleteLineReq, // 仅含 id 字段的删除请求参数
) -> Result<serde_json::Value, String> {
    // 基础参数校验（ID 需为正整数）
    if req.id <= 0 {
        return Ok(serde_json::json!({
            "success": false,
            "message": format!("无效的线条ID：{}，ID 必须为正整数", req.id),
            "data": req,
            "count": 0
        }));
    }

    match delete_stock_line(&app, &req) {
        Ok(true) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功删除 ID 为 {} 的线条", req.id),
            "data": { "deleted_line_id": req.id }, // 返回被删除的ID
            "count": 1 // 删除成功1条数据
        })),
        Ok(false) => Ok(serde_json::json!({
            "success": false,
            "message": format!("未找到 ID 为 {} 的线条，删除失败", req.id),
            "data": req,
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("线条删除失败：{}", e),
            "data": req,
            "count": 0
        })),
    }
}
