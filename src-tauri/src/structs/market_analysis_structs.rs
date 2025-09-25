use serde::{Deserialize, Serialize};

/// 市场分析数据结构体（对应数据库表字段）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MarketAnalysis {
    pub date: String,     // 日期（主键，格式：YYYY-MM-DD）
    pub analysis: String, // 市场分析内容（非空）
    pub status: String,
}

/// 新增市场分析的请求参数
#[derive(Debug, Serialize, Deserialize)]
pub struct AddMarketAnalysisReq {
    pub date: String,     // 日期（前端传递，需符合 YYYY-MM-DD 格式）
    pub analysis: String, // 分析内容（前端传递，非空）
    pub status: String,
}
