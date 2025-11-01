use serde::{Deserialize, Serialize};

/// 委托结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub time: String,
    pub quantity: i32,
    pub cost: f64,
    pub action: String, // "买入" 或 "卖出"
}

/// 添加委托请求参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddOrderParams {
    pub code: String,
    pub name: String,
    pub time: String,
    pub quantity: i32,
    pub cost: f64,
    pub action: String,
}

/// 分页查询参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryOrdersParams {
    pub page: i32,      // 页码，从1开始
    pub page_size: i32, // 每页大小
}

/// 分页查询结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedOrders {
    pub orders: Vec<Order>,
    pub total: i32,       // 总记录数
    pub page: i32,        // 当前页码
    pub page_size: i32,   // 每页大小
    pub total_pages: i32, // 总页数
}
