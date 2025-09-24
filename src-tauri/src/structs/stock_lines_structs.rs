use serde::{Deserialize, Serialize};

/// 线条完整数据（与数据库表字段一一对应）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockLine {
    pub id: i32,        // 唯一自增ID（删除用）
    pub code: String,   // 股票代码
    pub period: String, // 周期（如day/week）
    pub x1: f64,        // 起点x坐标
    pub y1: f64,        // 起点y坐标
    pub x2: f64,        // 终点x坐标
    pub y2: f64,        // 终点y坐标
    pub width: f64,     // 画布宽度
    pub height: f64,    // 画布高度
}

/// 新增线条的请求参数
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AddLineReq {
    pub code: String,   // 股票代码
    pub period: String, // 周期（如day/week）
    pub x1: f64,        // 起点x坐标
    pub y1: f64,        // 起点y坐标
    pub x2: f64,        // 终点x坐标
    pub y2: f64,        // 终点y坐标
    pub width: f64,     // 画布宽度
    pub height: f64,    // 画布高度
}

/// 删除线条的请求参数（仅需ID）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeleteLineReq {
    pub id: i32, // 要删除的线条ID
}
