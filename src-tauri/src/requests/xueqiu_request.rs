use crate::requests::common::create_xueqiu_http_client;
use crate::structs::xueqiu_structs::{
    MinuteChartResponse, RawBatchQuoteResponse, RawKlineResponse, RawStockDetailResponse,
};
use tauri::AppHandle;

pub async fn fetch_raw_kline_data(
    app: &AppHandle,
    code: &str,
    period: &str,
    timestamp: &str,
    limit: i32,
) -> Result<RawKlineResponse, String> {
    // 构建请求URL
    let url = format!(
        "https://stock.xueqiu.com/v5/stock/chart/kline.json?symbol={}&begin={}&period={}&type=before&count=-{}&indicator=kline,pe,pb,ps,pcf,market_capital,agt,ggt,balance",
        code, timestamp, period, limit
    );
    println!("K线请求URL: {}", url);

    // 创建HTTP客户端
    let client =
        create_xueqiu_http_client(app).map_err(|e| format!("HTTP客户端创建失败: {}", e))?;

    // 发送请求
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("请求发送失败: {}", e))?;

    // 检查响应状态
    if !response.status().is_success() {
        return Err(format!("API请求失败，状态码: {}", response.status()));
    }

    // 解析原始响应
    let raw_response = response
        .json::<RawKlineResponse>()
        .await
        .map_err(|e| format!("JSON解析失败: {}", e))?;

    Ok(raw_response)
}

/// 爬取批量股票报价原始数据（对应 Python 的 get_selection_details）
/// 返回：RawBatchQuoteResponse（原始接口响应）
pub async fn fetch_raw_batch_quote(
    app: &AppHandle,
    symbols: &str, // 逗号分隔的股票代码（如 "SH600000,SZ000001"）
) -> Result<RawBatchQuoteResponse, String> {
    // 1. 构建请求 URL（匹配 Python 的批量报价接口）
    let url = format!(
        "https://stock.xueqiu.com/v5/stock/batch/quote.json?symbol={}",
        symbols
    );
    println!("批量报价请求URL: {}", url);

    // 2. 创建 HTTP 客户端（复用统一的 Cookie 逻辑）
    let client =
        create_xueqiu_http_client(app).map_err(|e| format!("HTTP客户端创建失败: {}", e))?;

    // 3. 发送请求（超时逻辑继承自 create_xueqiu_http_client）
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("批量报价请求发送失败: {}", e))?;

    // 4. 检查响应状态（处理 401/403 等 Cookie 相关错误）
    if !response.status().is_success() {
        let status = response.status();
        let err_msg = if status.as_u16() == 401 || status.as_u16() == 403 {
            "Cookie已过期或无效".to_string()
        } else {
            format!("批量报价API请求失败，状态码: {}", status)
        };
        return Err(err_msg);
    }

    // 5. 解析原始响应（匹配 RawBatchQuoteResponse 结构体）
    let raw_response = response
        .json::<RawBatchQuoteResponse>()
        .await
        .map_err(|e| format!("批量报价JSON解析失败: {}", e))?;

    Ok(raw_response)
}

/// 爬取单只股票详情原始数据
pub async fn fetch_raw_stock_detail(
    app: &AppHandle,
    code: &str, // 单个股票代码（如 "SH600000"）
) -> Result<RawStockDetailResponse, String> {
    // 1. 构建请求 URL（匹配 Python 的单只详情接口，带 extend=detail 参数）
    let url = format!(
        "https://stock.xueqiu.com/v5/stock/quote.json?symbol={}&extend=detail",
        code
    );
    println!("单只股票详情请求URL: {}", url);

    // 2. 创建 HTTP 客户端
    let client =
        create_xueqiu_http_client(app).map_err(|e| format!("HTTP客户端创建失败: {}", e))?;

    // 3. 发送请求
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("单只股票详情请求发送失败: {}", e))?;

    // 4. 检查响应状态（优先处理 Cookie 错误）
    if !response.status().is_success() {
        let status = response.status();
        let err_msg = match status.as_u16() {
            401 | 403 => "Cookie已过期或无效".to_string(),
            404 => format!("股票代码 {} 不存在（接口404）", code),
            _ => format!("单只股票详情API请求失败，状态码: {}", status),
        };
        return Err(err_msg);
    }

    // 5. 解析原始响应（匹配 RawStockDetailResponse 结构体）
    let raw_response = response
        .json::<RawStockDetailResponse>()
        .await
        .map_err(|e| format!("单只股票详情JSON解析失败: {}", e))?;

    Ok(raw_response)
}

pub async fn fetch_minute_chart(
    app: &AppHandle,
    code: &str,
) -> Result<MinuteChartResponse, String> {
    // 1. 构建请求 URL
    // 注意：URL中的 `period=1d` 是固定的，表示获取一天的数据
    let url = format!(
        "https://stock.xueqiu.com/v5/stock/chart/minute.json?symbol={}&period=1d",
        code
    );
    println!("分时图数据请求URL: {}", url);

    // 2. 创建 HTTP 客户端（复用统一的 Cookie 和超时逻辑）
    let client =
        create_xueqiu_http_client(app).map_err(|e| format!("HTTP客户端创建失败: {}", e))?;

    // 3. 发送请求
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("分时图数据请求发送失败: {}", e))?;

    // 4. 检查响应状态
    if !response.status().is_success() {
        let status = response.status();
        let err_msg = if status.as_u16() == 401 || status.as_u16() == 403 {
            "Cookie已过期或无效，请重新登录。".to_string()
        } else {
            format!("分时图API请求失败，状态码: {}", status)
        };
        return Err(err_msg);
    }

    // 5. 解析JSON响应
    // 使用 .json() 方法直接将响应体解析为我们定义的 MinuteChartResponse 结构体
    let chart_data = response
        .json::<MinuteChartResponse>()
        .await
        .map_err(|e| format!("分时图JSON解析失败: {}", e))?;

    Ok(chart_data)
}
