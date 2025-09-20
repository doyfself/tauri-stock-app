use serde::{Deserialize, Serialize};
use thiserror::Error;
// -------------------------- 1. 自定义错误类型 --------------------------
#[derive(Error, Debug)]
pub enum StockError {
    // 网络请求错误（封装 reqwest 错误）
    #[error("网络请求失败: {0}")]
    HttpError(#[from] reqwest::Error),
    // JSON 解析错误（封装 serde_json 错误）
    #[error("JSON 解析失败: {0}")]
    JsonError(#[from] serde_json::Error),
    // 数据库错误（封装 rusqlite 错误）
    #[error("数据库操作失败: {0}")]
    DbError(#[from] rusqlite::Error),
    // 自定义业务错误
    #[error("业务错误: {0}")]
    BusinessError(String),
}

// -------------------------- 2. 雪球 API 响应模型 --------------------------
// API 顶层响应（对应 {data: ...}）
#[derive(Debug, Deserialize)]
pub struct StockApiResponse {
    pub data: StockData,
}

// API 数据部分（对应 {count: 5000, list: [...]}）
#[derive(Debug, Deserialize)]
pub struct StockData {
    pub count: u32,           // 总数据条数
    pub list: Vec<StockItem>, // 单页股票列表
}

// 单条股票数据（对应 {symbol, name}）
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct StockItem {
    pub symbol: String, // 股票代码（如 "600000"）
    pub name: String,   // 股票名称（如 "浦发银行"）
}
