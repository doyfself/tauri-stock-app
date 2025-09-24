use crate::db::selection_db::{
    add_or_update_selection, delete_selection, get_all_selections, get_selection_by_code,
    is_selection_exists, update_selection_sort,
};
use crate::structs::selection_structs::{Selection, UpdateSelectionSortParams};
use serde_json;
use tauri::command;
use tauri::AppHandle;

// --------------------------
// 1. 获取所有自选股 Command
// --------------------------
#[command]
pub fn get_all_selections_cmd(app: AppHandle) -> Result<serde_json::Value, String> {
    match get_all_selections(&app) {
        Ok(selections) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功获取 {} 条自选股数据", selections.len()),
            "data": selections,
            "count": selections.len()
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("获取自选股失败: {}", e), // 自动调用 StockError 的 to_string()
            "data": [],
            "count": 0
        })),
    }
}

// --------------------------
// 2. 根据代码获取单个自选股 Command
// --------------------------
#[command]
pub fn get_selection_by_code_cmd(
    app: AppHandle,
    code: String,
) -> Result<serde_json::Value, String> {
    match get_selection_by_code(&app, &code) {
        Ok(Some(selection)) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功获取代码「{}」的自选股数据", code),
            "data": selection,
            "count": 1
        })),
        Ok(None) => Ok(serde_json::json!({
            "success": false,
            "message": format!("未找到代码「{}」的自选股", code),
            "data": {},
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("查询自选股失败: {}", e),
            "data": {},
            "count": 0
        })),
    }
}

// --------------------------
// 3. 检查自选股是否存在 Command
// --------------------------
#[command]
pub fn is_selection_exists_cmd(app: AppHandle, code: String) -> Result<serde_json::Value, String> {
    match is_selection_exists(&app, &code) {
        Ok(true) => Ok(serde_json::json!({
            "success": true,
            "message": format!("代码「{}」已在自选股中", code),
            "data": true, // 返回布尔值表示“存在”
            "count": 0
        })),
        Ok(false) => Ok(serde_json::json!({
            "success": true, // 检查操作本身成功，只是结果为“不存在”
            "message": format!("代码「{}」不在自选股中", code),
            "data": false,
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("检查自选股存在性失败: {}", e),
            "data": false,
            "count": 0
        })),
    }
}

// --------------------------
// 5. 添加/更新单个自选股 Command
// --------------------------
#[command]
pub fn add_or_update_selection_cmd(
    app: AppHandle,
    selection: Selection,
) -> Result<serde_json::Value, String> {
    match add_or_update_selection(&app, &selection) {
        Ok(_) => {
            // 额外判断是“新增”还是“更新”（提升用户体验）
            let is_new = !is_selection_exists(&app, &selection.code).unwrap_or(false);
            Ok(serde_json::json!({
                "success": true,
                "message": if is_new {
                    format!("成功添加「{}({})」到自选股", selection.name, selection.code)
                } else {
                    format!("成功更新「{}({})」的自选股数据", selection.name, selection.code)
                },
                "data": true,
                "count": 1
            }))
        }
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("添加/更新自选股失败: {}", e),
            "data": false,
            "count": 0
        })),
    }
}

// --------------------------
// 6. 更新自选股排序 Command
// --------------------------
#[command]
pub fn update_selection_sort_cmd(
    app: AppHandle,
    params: UpdateSelectionSortParams,
) -> Result<serde_json::Value, String> {
    if params.new_order.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "排序的自选股代码列表不能为空",
            "data": false,
            "count": 0
        }));
    }

    match update_selection_sort(&app, &params) {
        Ok(_) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功更新 {} 条自选股的排序顺序", params.new_order.len()),
            "data": true, // 返回新的排序顺序
            "count": params.new_order.len()
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("更新自选股排序失败: {}", e),
            "data": false,
            "count": 0
        })),
    }
}

// --------------------------
// 7. 删除自选股 Command
// --------------------------
#[command]
pub fn delete_selection_cmd(app: AppHandle, code: String) -> Result<serde_json::Value, String> {
    match delete_selection(&app, &code) {
        Ok(true) => Ok(serde_json::json!({
            "success": true,
            "message": format!("成功删除代码「{}」的自选股", code),
            "data": true, // 返回被删除的代码
            "count": 1
        })),
        Ok(false) => Ok(serde_json::json!({
            "success": false,
            "message": format!("未找到代码「{}」的自选股，删除失败", code),
            "data": false,
            "count": 0
        })),
        Err(e) => Ok(serde_json::json!({
            "success": false,
            "message": format!("删除自选股失败: {}", e),
            "data": false,
            "count": 0
        })),
    }
}
