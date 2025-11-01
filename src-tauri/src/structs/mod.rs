use thiserror::Error;
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
pub mod holdings_structs;
pub mod market_analysis_structs;
pub mod orders_structs;
pub mod selection_structs;
pub mod self_reflect_structs;
pub mod stock_lines_structs;
pub mod stock_review_structs;
pub mod stock_structs;
pub mod xueqiu_structs;
