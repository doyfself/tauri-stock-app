// holdings_structs.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Holding {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub cost: f64,
    pub quantity: i32,
    pub hold_time: String,         // 持仓时间
    pub status: i32,               // 状态：1-当前持仓，0-历史记录
    pub sell_time: Option<String>, // 卖出时间（可为空）
    pub sell_price: Option<f64>,   // 卖出价格（可为空）
    pub profit: Option<f64>,       // 盈利（可为空）
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddHoldingReq {
    pub code: String,
    pub name: String,
    pub cost: f64,
    pub quantity: i32,
    pub hold_time: String,   // 必须传入持仓时间
    pub status: Option<i32>, // 可选，默认为1
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateHoldingReq {
    pub id: i32,
    pub cost: Option<f64>,
    pub quantity: Option<i32>,
    pub status: Option<i32>,       // 可更新状态
    pub sell_time: Option<String>, // 可更新卖出时间
    pub sell_price: Option<f64>,   // 可更新卖出价格
    pub profit: Option<f64>,       // 可更新盈利
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteHoldingReq {
    pub id: i32,
}

// 用于前端查询的参数
#[derive(Debug, Serialize, Deserialize)]
pub struct QueryHoldingsReq {
    pub status: Option<i32>, // 可选，1-当前持仓，0-历史记录，None-全部
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PagedHistoryHoldings {
    pub holdings: Vec<Holding>,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PagedResult<T> {
    pub data: Vec<T>,
    pub total: i32,
    pub page: i32,
    pub page_size: i32,
    pub total_pages: i32,
}

/// 分页查询参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryHistoryParams {
    pub page: i32,      // 页码，从1开始
    pub page_size: i32, // 每页大小
}

#[derive(serde::Deserialize)]
pub struct MonthlyStatsParams {
    pub year: i32,
    pub month: i32,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct MonthlyStats {
    pub year: i32,
    pub month: i32,
    pub operation_count: i32, // 操作次数
    pub win_rate: f64,        // 胜率（0.0 ~ 1.0）
    pub total_profit: f64,    // 总盈利金额
}
