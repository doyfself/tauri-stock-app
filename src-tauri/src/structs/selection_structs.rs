use serde::{Deserialize, Serialize};

// 自选股核心结构体（与 CSV 表头 ["code", "name", "color", "remark", "sort"] 对应）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Selection {
    pub code: String,   // 股票代码（主键）
    pub name: String,   // 股票名称
    pub color: String,  // 颜色标识（如 "#FF0000"）
    pub remark: String, // 备注信息
    pub sort: i32,      // 排序序号
}

// 自选股数据库操作的请求参数结构体（供 Command 使用）
#[derive(Debug, Deserialize)]
pub struct UpdateSelectionSortParams {
    pub new_order: Vec<String>, // 新的排序顺序（股票代码列表）
}
