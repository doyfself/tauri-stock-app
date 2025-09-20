use crate::db::selection as db;
use db::Selection;
use serde::{Deserialize, Serialize};
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    count: Option<usize>,
    message: String,
}

#[derive(Debug, Deserialize)]
pub struct SelectionParams {
    code: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSortRequest {
    new_order_codes: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeleteRequest {
    code: String,
}

/// 获取所有自选项目
#[tauri::command]
pub fn get_selection() -> ApiResponse<Vec<Selection>> {
    match db::get_all_selections() {
        Ok(selections) => ApiResponse {
            success: true,
            data: Some(selections.clone()),
            count: Some(selections.len()),
            message: "自选列表获取成功".to_string(),
        },
        Err(e) => ApiResponse {
            success: false,
            data: None,
            count: None,
            message: format!("读取自选列表失败: {}", e),
        },
    }
}

/// 根据代码获取自选项目
#[tauri::command]
pub fn get_selection_remark(params: SelectionParams) -> ApiResponse<Selection> {
    let code = match &params.code {
        Some(c) => c,
        None => {
            return ApiResponse {
                success: false,
                data: None,
                count: None,
                message: "缺少code参数".to_string(),
            }
        }
    };

    if code.is_empty() {
        return ApiResponse {
            success: false,
            data: None,
            count: None,
            message: "code参数不能为空".to_string(),
        };
    }

    match db::get_selection_by_code(code) {
        Ok(Some(selection)) => ApiResponse {
            success: true,
            data: Some(selection),
            count: None,
            message: format!("获取{}备注成功", code),
        },
        Ok(None) => ApiResponse {
            success: false,
            data: None,
            count: None,
            message: format!("未找到code为{}的自选记录", code),
        },
        Err(e) => ApiResponse {
            success: false,
            data: None,
            count: None,
            message: format!("获取备注失败: {}", e),
        },
    }
}

/// 检查自选项目是否存在
#[tauri::command]
pub fn is_selection_exists(code: String) -> ApiResponse<bool> {
    match db::is_selection_exists(&code) {
        Ok(exists) => ApiResponse {
            success: true,
            data: Some(exists),
            count: None,
            message: "检查成功".to_string(),
        },
        Err(e) => ApiResponse {
            success: false,
            data: None,
            count: None,
            message: format!("检查失败: {}", e),
        },
    }
}

/// 添加或更新自选项目
#[tauri::command]
pub fn add_selection(selection: Selection) -> ApiResponse<bool> {
    if selection.code.is_empty() {
        return ApiResponse {
            success: false,
            data: None,
            count: None,
            message: "股票代码不能为空".to_string(),
        };
    }

    match db::add_or_update_selection(&selection) {
        Ok(_) => ApiResponse {
            success: true,
            data: Some(true),
            count: None,
            message: "自选项目添加/更新成功".to_string(),
        },
        Err(e) => ApiResponse {
            success: false,
            data: Some(false),
            count: None,
            message: format!("操作失败: {}", e),
        },
    }
}

/// 更新自选项目排序
#[tauri::command]
pub fn update_selection_sort(request: UpdateSortRequest) -> ApiResponse<Vec<i32>> {
    if request.new_order_codes.is_empty() {
        return ApiResponse {
            success: false,
            data: None,
            count: None,
            message: "请提供有效的新排序代码列表".to_string(),
        };
    }

    match db::update_selection_sort(&request.new_order_codes) {
        Ok(_) => {
            let new_sort: Vec<i32> = (1..=request.new_order_codes.len() as i32).collect();
            ApiResponse {
                success: true,
                data: Some(new_sort),
                count: Some(request.new_order_codes.len()),
                message: "排序更新成功".to_string(),
            }
        }
        Err(e) => ApiResponse {
            success: false,
            data: None,
            count: None,
            message: format!("排序更新失败: {}", e),
        },
    }
}

/// 删除自选项目
#[tauri::command]
pub fn delete_selection(request: DeleteRequest) -> ApiResponse<bool> {
    match db::delete_selection(&request.code) {
        Ok(true) => ApiResponse {
            success: true,
            data: Some(true),
            count: None,
            message: format!("成功删除代码为 {} 的自选项目", request.code),
        },
        Ok(false) => ApiResponse {
            success: false,
            data: Some(false),
            count: None,
            message: format!("未找到代码为 {} 的自选项目", request.code),
        },
        Err(e) => ApiResponse {
            success: false,
            data: Some(false),
            count: None,
            message: format!("删除自选项目失败: {}", e),
        },
    }
}
