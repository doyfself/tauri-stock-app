use crate::db::trend_lines_db::{add_trend_line, delete_trend_line, query_trend_lines};
use crate::structs::trend_lines_structs::{AddTrendLineReq, DeleteTrendLineReq};
use serde_json;
use tauri::command;
use tauri::AppHandle;

// --------------------------
// 1. 新增趋势线 Command（支持批量）
// --------------------------
#[command]
pub fn add_trend_lines_cmd(
    app: AppHandle,
    reqs: Vec<AddTrendLineReq>,
) -> Result<serde_json::Value, String> {
    let mut success_ids = Vec::new();
    let mut failed_lines = Vec::new();

    for req in reqs {
        match add_trend_line(&app, &req) {
            Ok(new_id) => {
                success_ids.push((new_id, req));
            }
            Err(e) => {
                failed_lines.push((req, format!("数据库操作失败：{}", e)));
            }
        }
    }

    let total = success_ids.len() + failed_lines.len();
    let success_count = success_ids.len();

    if success_count > 0 && failed_lines.is_empty() {
        Ok(serde_json::json!({
            "success": true,
            "message": format!("全部 {} 条趋势线新增成功", total),
            "data": true,
            "count": success_count
        }))
    } else if success_count > 0 {
        Ok(serde_json::json!({
            "success": false,
            "message": format!("部分趋势线新增失败，成功 {} 条，失败 {} 条", success_count, failed_lines.len()),
            "data": true,
            "count": success_count
        }))
    } else {
        Ok(serde_json::json!({
            "success": false,
            "message": format!("全部 {} 条趋势线新增失败", total),
            "data": false,
            "count": 0
        }))
    }
}

// --------------------------
// 2. 查询趋势线 Command（按 code + period）
// --------------------------
#[command]
pub fn query_trend_lines_cmd(
    app: AppHandle,
    code: String,
    period: String,
) -> Result<serde_json::Value, String> {
    if code.is_empty() || period.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "股票代码（code）和周期（period）为必填参数，不能为空",
            "data": [],
            "count": 0
        }));
    }

    match query_trend_lines(&app, &code, &period) {
        Ok(lines) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功查询到 {} 条趋势线数据（股票：{}，周期：{}）", lines.len(), code, period),
            "data": lines,
            "count": lines.len()
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("趋势线查询失败：{}", e),
            "data": [],
            "count": 0
        })),
    }
}

// --------------------------
// 3. 删除趋势线 Command（按 ID）
// --------------------------
#[command]
pub fn delete_trend_line_cmd(
    app: AppHandle,
    req: DeleteTrendLineReq,
) -> Result<serde_json::Value, String> {
    if req.id <= 0 {
        return Ok(serde_json::json!({
            "success": false,
            "message": format!("无效的趋势线ID：{}，ID 必须为正整数", req.id),
            "data": { "id": req.id },
            "count": 0
        }));
    }

    match delete_trend_line(&app, &req) {
        Ok(true) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功删除 ID 为 {} 的趋势线", req.id),
            "data": { "deleted_line_id": req.id },
            "count": 1
        })),
        Ok(false) => Ok(serde_json::json!({
            "success": false,
            "message": format!("未找到 ID 为 {} 的趋势线，删除失败", req.id),
            "data": { "id": req.id },
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("趋势线删除失败：{}", e),
            "data": { "id": req.id },
            "count": 0
        })),
    }
}
