use crate::db::orders_db::{add_order, delete_order, query_orders};
use crate::structs::orders_structs::{AddOrderParams, Order, QueryOrdersParams};
use serde_json;
use tauri::command;
use tauri::AppHandle;

// --------------------------
// 1. 获取所有委托 Command
// --------------------------
#[command]
pub fn get_all_orders_cmd(
    app: AppHandle,
    params: QueryOrdersParams,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if params.page < 1 {
        return Ok(serde_json::json!({
            "success": false,
            "message": "页码必须大于等于1",
            "data": null,
            "count": 0
        }));
    }

    if params.page_size < 1 || params.page_size > 100 {
        return Ok(serde_json::json!({
            "success": false,
            "message": "每页大小必须在1-100之间",
            "data": null,
            "count": 0
        }));
    }

    match query_orders(&app, &params) {
        Ok(paginated_data) => Ok(serde_json::json!({
            "success": true,
            "message": format!(
                "成功获取第 {} 页委托数据，共 {} 条，总计 {} 条",
                params.page,
                paginated_data.orders.len(),
                paginated_data.total
            ),
            "data": paginated_data,
            "count": paginated_data.orders.len()
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("获取委托失败: {}", e),
            "data": null,
            "count": 0
        })),
    }
}

// --------------------------
// 2. 添加委托 Command
// --------------------------
#[command]
pub fn add_order_cmd(app: AppHandle, params: AddOrderParams) -> Result<serde_json::Value, String> {
    match add_order(&app, &params) {
        Ok(id) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功添加委托，委托ID: {}", id),
            "data": id,
            "count": 1
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("添加委托失败: {}", e),
            "data": 0,
            "count": 0
        })),
    }
}

/// 删除委托 Command
#[command]
pub fn delete_order_cmd(app: AppHandle, id: i32) -> Result<serde_json::Value, String> {
    // 参数验证
    if id <= 0 {
        return Ok(serde_json::json!({
            "success": false,
            "message": "委托ID必须大于0",
            "data": false,
            "count": 0
        }));
    }

    match delete_order(&app, id) {
        Ok(()) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功删除委托，委托ID: {}", id),
            "data": true,
            "count": 1
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("删除委托失败: {}", e),
            "data": false,
            "count": 0
        })),
    }
}
