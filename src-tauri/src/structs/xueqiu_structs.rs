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
pub struct RawBatchQuoteResponse {
    pub data: RawBatchQuoteData,
}

#[derive(Debug, Deserialize)]
pub struct RawBatchQuoteData {
    pub items: Vec<RawBatchQuoteItem>,
}

#[derive(Debug, Deserialize)]
pub struct RawBatchQuoteItem {
    pub quote: Option<StockQuote>, // 单只股票的报价数据
}

/// 单只股票详情接口的原始返回结构
#[derive(Debug, Deserialize)]
pub struct RawStockDetailResponse {
    pub data: RawStockDetailData,
}

#[derive(Debug, Deserialize)]
pub struct RawStockDetailData {
    pub quote: Option<StockDetail>, // 股票详情数据
}

// --------------------------
// 2. 业务层数据结构（解析后的目标格式）
// --------------------------
/// 解析后的 K 线数据结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockKlineItem {
    pub date: i64,         // 格式化后的时间（YYYY-MM-DD HH:MM）
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
    pub code: String,
    pub name: String,
    pub current: f64, // 当前价
    pub percent: f64, // 涨跌幅
}

/// 股票详情数据结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockDetail {
    // 基础信息
    pub name: String,   // 股票名称
    pub symbol: String, // 股票代码（如 SH600000、SZ000001）

    // 价格相关
    pub current: Option<f64>,    // 当前价格
    pub last_close: Option<f64>, // 昨收价（上一交易日收盘价）
    pub open: Option<f64>,       // 当日开盘价
    pub high: Option<f64>,       // 当日最高价
    pub low: Option<f64>,        // 当日最低价
    pub limit_up: Option<f64>,   // 涨停价（当日价格上限）
    pub limit_down: Option<f64>, // 跌停价（当日价格下限）

    // 估值相关（市盈率）
    pub pe_lyr: Option<f64>,      // 静态市盈率（基于上一财年财务数据）
    pub pe_ttm: Option<f64>,      // 动态市盈率（基于过去12个月滚动财务数据）
    pub pe_forecast: Option<f64>, // 预测市盈率（基于未来盈利预期）

    // 市场表现相关
    pub percent: Option<f64>,        // 涨跌幅（单位：%，正数为涨，负数为跌）
    pub market_capital: Option<f64>, // 市值（通常单位：亿元）
    pub volume_ratio: Option<f64>,   // 量比（当日成交量与近5日平均成交量的比值）
    pub turnover_rate: Option<f64>,  // 换手率（单位：%，当日成交量占流通股本的比例）

    pub amount: Option<f64>, // 成交额（通常单位：亿元）
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
/// 分时图请求参数
#[derive(Debug, Deserialize)]
pub struct GetMinuteDataParams {
    pub code: String, // 股票代码（如 SH600000）            // 数据条数
}

/// 分时图数据的顶层响应结构体
/// 匹配格式: { data: { items: [...] } }
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MinuteChartResponse {
    pub data: MinuteChartData,
}

/// 包含分时图项目数组的结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MinuteChartData {
    pub items: Vec<MinuteChartItem>,
}

/// 单个分时数据点
/// 匹配格式: { percent: -0.47, timestamp: 1760059800000, volume: 320500 }
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MinuteChartItem {
    pub percent: f64,
    pub timestamp: i64,
    pub volume: i64,
}
