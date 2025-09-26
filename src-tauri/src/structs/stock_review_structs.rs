use serde::{Deserialize, Serialize};

/// 股票评论数据结构（与 stock_review 表字段对应）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockReview {
    pub id: i32,             // 自增id
    pub title: String,       // 评论标题
    pub code: String,        // 股票代码
    pub date: String,        // 日期（格式：年-月-日）
    pub r#type: String,      // 评论类型（注意：type是Rust关键字，用r#type转义）
    pub description: String, // 评论内容
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockReviewListItem {
    pub id: i32,       // 自增id
    pub title: String, // 评论标题
}

/// 新增评论的请求参数
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AddReviewReq {
    pub id: Option<i32>,
    pub r#type: String,      // 评论类型（必填）
    pub code: String,        // 股票代码（必填）
    pub title: String,       // 评论标题（必填）
    pub date: String,        // 日期（必填）
    pub description: String, // 评论内容（必填）
}

/// 获取评论列表的请求参数（支持类型筛选和关键字搜索）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GetReviewListReq {
    pub r#type: String,          // 评论类型（必填）
    pub keyword: Option<String>, // 标题搜索关键字（可选）
}

/// 获取/删除单条评论的请求参数
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GetOrDeleteReviewReq {
    pub id: i32, // 评论ID（必填）
}
