use serde::{Deserialize, Serialize};

/// K线数据接口的原始返回结构
#[derive(Debug, Deserialize)]
pub struct RawKlineResponse {
    pub data: RawKlineData,
}

#[derive(Debug, Deserialize)]
pub struct RawKlineData {
    pub column: Vec<String>, // 字段名列表（如 ["timestamp", "open", "high"...]）
    pub item: Vec<Vec<serde_json::Value>>, // 数据列表（每个元素是一条K线的所有字段值）
}

/// 批量股票报价接口的原始返回结构
#[derive(Debug, Deserialize)]
struct RawBatchQuoteResponse {
    data: RawBatchQuoteData,
}

#[derive(Debug, Deserialize)]
struct RawBatchQuoteData {
    items: Vec<RawBatchQuoteItem>,
}

#[derive(Debug, Deserialize)]
struct RawBatchQuoteItem {
    quote: Option<StockQuote>, // 单只股票的报价数据
}

/// 单只股票详情接口的原始返回结构
#[derive(Debug, Deserialize)]
struct RawStockDetailResponse {
    data: RawStockDetailData,
}

#[derive(Debug, Deserialize)]
struct RawStockDetailData {
    quote: Option<StockDetail>, // 股票详情数据
}

// --------------------------
// 2. 业务层数据结构（解析后的目标格式）
// --------------------------
/// 解析后的 K 线数据结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockKlineItem {
    pub date: String,      // 格式化后的时间（YYYY-MM-DD HH:MM）
    pub open: f64,         // 开盘价
    pub high: f64,         // 最高价
    pub low: f64,          // 最低价
    pub close: f64,        // 收盘价
    pub volume: f64,       // 成交量
    pub percent: f64,      // 涨跌幅
    pub turnoverrate: f64, // 换手率
}

/// 股票报价数据结构（批量查询用）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockQuote {
    // 根据实际接口字段补充，例如：
    pub symbol: String,
    pub name: String,
    pub current: f64, // 当前价
    pub percent: f64, // 涨跌幅
    pub high: f64,    // 最高价
    pub low: f64,     // 最低价
}

/// 股票详情数据结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockDetail {
    // 根据实际接口字段补充，例如：
    pub symbol: String,
    pub name: String,
    pub current: f64,        // 当前价
    pub open: f64,           // 开盘价
    pub close: f64,          // 昨收价
    pub market_capital: f64, // 市值
    pub turnover_rate: f64,  // 换手率
    pub pe_ttm: f64,         // 动态PE
}

// --------------------------
// 3. 请求参数结构体（对应 Python 的 params）
// --------------------------
/// K线数据请求参数
#[derive(Debug, Deserialize)]
pub struct GetStockDataParams {
    pub code: String,              // 股票代码（如 SH600000）
    pub period: String,            // 周期（daily/weekly/monthly）
    pub timestamp: Option<String>, // 起始时间戳（可选）
    pub limit: i32,                // 数据条数
}

/// 批量股票报价请求参数
#[derive(Debug, Deserialize)]
pub struct GetSelectionDetailsParams {
    pub symbols: String, // 股票代码列表（用逗号分隔，如 SH600000,SZ000001）
}

/// 单只股票详情请求参数
#[derive(Debug, Deserialize)]
pub struct GetStockDetailsParams {
    pub code: String, // 股票代码
}
