use serde::{Deserialize, Serialize};

/// 股票评论数据结构（与 stock_review 表字段对应）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReflectItem {
    pub id: i32,             // 自增id
    pub title: String,       // 评论标题
    pub code: String,        // 股票代码
    pub date: String,        // 日期（格式：年-月-日）
    pub description: String, // 评论内容
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReflectListItem {
    pub id: i32,       // 自增id
    pub title: String, // 评论标题
}

/// 新增评论的请求参数
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AddReflectReq {
    pub id: Option<i32>,
    pub code: String,        // 股票代码（必填）
    pub title: String,       // 评论标题（必填）
    pub date: String,        // 日期（必填）
    pub description: String, // 评论内容（必填）
}

/// 获取/删除单条评论的请求参数
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GetOrDeleteReflectReq {
    pub id: i32, // 评论ID（必填）
}
