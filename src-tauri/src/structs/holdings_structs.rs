use serde::{Deserialize, Serialize};

/// 持仓结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Holding {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub cost: f64,
    pub quantity: i32,
}

/// 添加持仓请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddHoldingReq {
    pub code: String,
    pub name: String,
    pub cost: f64,
    pub quantity: i32,
}

/// 删除持仓请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteHoldingReq {
    pub id: i32,
}

/// 更新持仓请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateHoldingReq {
    pub id: i32,
    pub cost: f64,
    pub quantity: i32,
}
