use crate::db::stock_review_db::{
    add_stock_review, delete_stock_review, get_single_stock_review, get_stock_review_list,
};
use crate::structs::stock_review_structs::{AddReviewReq, GetOrDeleteReviewReq, GetReviewListReq};
use serde_json;
use tauri::command;
use tauri::AppHandle;

// --------------------------
// 1. 评论列表查询 Command
// --------------------------
#[command]
pub fn get_stock_review_list_cmd(
    app: AppHandle,
    req: GetReviewListReq, // 接收筛选参数（类型+关键字）
) -> Result<serde_json::Value, String> {
    // 参数校验：评论类型（type）为必填
    if req.r#type.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "评论类型（type）为必填参数，不能为空",
            "data": [],
            "count": 0
        }));
    }

    match get_stock_review_list(&app, &req) {
        Ok(reviews) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功查询到 {} 条评论数据（类型：{}）", reviews.len(), req.r#type),
            "data": reviews,          // 返回评论列表（含完整字段）
            "count": reviews.len()    // 数据条数
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("评论列表查询失败：{}", e),
            "data": [],
            "count": 0
        })),
    }
}

// --------------------------
// 2. 新增评论 Command
// --------------------------
#[command]
pub fn add_stock_review_cmd(
    app: AppHandle,
    req: AddReviewReq, // 接收新增参数（标题、代码、日期等）
) -> Result<serde_json::Value, String> {
    // 参数校验：必填字段非空
    let mut error_msgs = Vec::new();
    if req.r#type.is_empty() {
        error_msgs.push("评论类型（type）不能为空");
    }
    if req.title.is_empty() {
        error_msgs.push("评论标题（title）不能为空");
    }
    if req.date.is_empty() {
        error_msgs.push("日期（date）不能为空");
    }
    if req.code.is_empty() {
        error_msgs.push("股票代码（code）不能为空");
    }

    // 有错误则返回所有校验失败信息
    if !error_msgs.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": error_msgs.join("；"),
            "data": req,
            "count": 0
        }));
    }

    match add_stock_review(&app, &req) {
        Ok(new_review) => Ok(serde_json::json!({
            "success": true,
            "message": format!("评论新增成功（ID：{}）", new_review.id),
            "data": new_review,        // 返回新增的完整评论数据（含自增ID）
            "count": 1
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("评论新增失败：{}", e),
            "data": req,
            "count": 0
        })),
    }
}

// --------------------------
// 3. 单条评论查询 Command（按ID）
// --------------------------
#[command]
pub fn get_single_stock_review_cmd(
    app: AppHandle,
    req: GetOrDeleteReviewReq, // 接收ID参数（i32类型）
) -> Result<serde_json::Value, String> {
    // 参数校验：ID需为正整数
    if req.id <= 0 {
        return Ok(serde_json::json!({
            "success": false,
            "message": format!("无效的评论ID：{}，ID必须为正整数", req.id),
            "data": null,
            "count": 0
        }));
    }

    match get_single_stock_review(&app, &req) {
        Ok(Some(review)) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功查询到ID为 {} 的评论", req.id),
            "data": review,          // 返回单条评论完整数据
            "count": 1
        })),
        Ok(None) => Ok(serde_json::json!({
            "success": false,
            "message": format!("未找到ID为 {} 的评论", req.id),
            "data": null,
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("单条评论查询失败：{}", e),
            "data": null,
            "count": 0
        })),
    }
}

// --------------------------
// 4. 评论删除 Command（按ID）
// --------------------------
#[command]
pub fn delete_stock_review_cmd(
    app: AppHandle,
    req: GetOrDeleteReviewReq, // 接收ID参数（i32类型）
) -> Result<serde_json::Value, String> {
    // 参数校验：ID需为正整数
    if req.id <= 0 {
        return Ok(serde_json::json!({
            "success": false,
            "message": format!("无效的评论ID：{}，ID必须为正整数", req.id),
            "data": req,
            "count": 0
        }));
    }

    match delete_stock_review(&app, &req) {
        Ok(true) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功删除ID为 {} 的评论", req.id),
            "data": { "deleted_id": req.id }, // 返回被删除的ID
            "count": 1
        })),
        Ok(false) => Ok(serde_json::json!({
            "success": false,
            "message": format!("未找到ID为 {} 的评论，删除失败", req.id),
            "data": req,
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("评论删除失败：{}", e),
            "data": req,
            "count": 0
        })),
    }
}
