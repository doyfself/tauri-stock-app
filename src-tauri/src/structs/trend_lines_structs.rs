#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AddTrendLineReq {
    pub code: String,
    pub period: String,
    pub start_time: i64, // 13位时间戳
    pub start_price: f64,
    pub end_time: i64, // 13位时间戳
    pub end_price: f64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DeleteTrendLineReq {
    pub id: i32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TrendLine {
    pub id: i32,
    pub code: String,
    pub period: String,
    pub start_time: i64,
    pub start_price: f64,
    pub end_time: i64,
    pub end_price: f64,
}
