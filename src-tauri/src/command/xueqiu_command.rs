use crate::requests::xueqiu_request::{
    fetch_minute_chart, fetch_raw_batch_quote, fetch_raw_kline_data, fetch_raw_stock_detail,
};
use crate::structs::xueqiu_structs::{
    GetMinuteDataParams, GetStockDataParams, MinuteChartResponse, RawBatchQuoteData,
    RawBatchQuoteItem, RawKlineData, RawStockDetailData, StockKlineItem, StockQuote,
};
use chrono::Utc;
use serde_json;
use tauri::command;
use tauri::AppHandle;

/// Tauri Command：获取股票K线数据并返回JSON格式响应
#[command]
pub async fn get_kline_data(
    app: AppHandle,
    params: GetStockDataParams,
) -> Result<serde_json::Value, String> {
    println!("Received params: {:?}", params);
    // 1. 参数校验
    let code = params.code.trim().to_uppercase();
    if code.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "股票代码不能为空",
            "data": [],
            "count": 0
        }));
    }

    let period = params.period.trim().to_lowercase();

    let limit = params.limit;

    // 2. 处理时间戳
    let timestamp = match params.timestamp {
        Some(ts) if !ts.trim().is_empty() => ts.trim().to_string(),
        _ => {
            let one_day_ms = 24 * 60 * 60 * 1000;
            let current_ts = Utc::now().timestamp_millis() + one_day_ms;
            current_ts.to_string()
        }
    };

    println!(
        "Fetching Kline data for code: {}, period: {}, timestamp: {}, limit: {}",
        code, period, timestamp, limit
    );

    // 3. 调用爬取函数获取原始数据
    let raw_response = match fetch_raw_kline_data(&app, &code, &period, &timestamp, limit).await {
        Ok(data) => data,
        Err(e) => {
            let msg = if e.contains("401") || e.contains("403") {
                "Cookie已过期或无效，请重新登录雪球并更新Cookie"
            } else if e.contains("404") {
                "请求的股票K线接口不存在（可能是雪球接口更新）"
            } else if e.contains("500") {
                "雪球服务器错误，请稍后再试"
            } else {
                &e
            };
            return Ok(serde_json::json!({
                "success": false,
                "message": msg,
                "data": [],
                "count": 0
            }));
        }
    };

    // 4. 解析原始数据为业务结构体
    let RawKlineData { column, item } = raw_response.data;
    if item.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": format!("未获取到 {} 的K线数据（可能是股票代码无效）", code),
            "data": [],
            "count": 0
        }));
    }

    let mut parsed_kline = Vec::new();
    for kline_item in item {
        // 构建字段映射
        let data_map: std::collections::HashMap<&str, &serde_json::Value> = column
            .iter()
            .zip(kline_item.iter())
            .map(|(col_name, val)| (col_name.as_str(), val))
            .collect();
        // 解析时间戳
        let timestamp = data_map
            .get("timestamp")
            .and_then(|v| v.as_i64())
            .unwrap_or(0);

        // 解析数值字段
        let parse_num = |key: &str| -> f64 {
            data_map
                .get(key)
                .and_then(|v| match v {
                    serde_json::Value::Null => None,
                    serde_json::Value::Number(n) => n.as_f64(),
                    serde_json::Value::String(s) => s.parse().ok(),
                    _ => None,
                })
                .unwrap_or(0.0)
        };

        parsed_kline.push(StockKlineItem {
            date: timestamp,
            open: parse_num("open"),
            high: parse_num("high"),
            low: parse_num("low"),
            close: parse_num("close"),
            volume: parse_num("volume"),
            percent: parse_num("percent"),
            turnoverrate: parse_num("turnoverrate"),
        });
    }

    // 5. 返回成功JSON响应（匹配你要求的格式）
    Ok(serde_json::json!({
        "success": true,
        "message": format!(
            "成功获取 {} 的 {} 条K线数据（周期：{}）",
            code,
            parsed_kline.len(),
            period
        ),
        "data": parsed_kline,
        "count": parsed_kline.len()
    }))
}

#[command]
pub async fn get_batch_stock_quote(
    app: AppHandle,
    symbols: &str, // 逗号分隔的股票代码（如 "SH600000,SZ000001"）
) -> Result<serde_json::Value, String> {
    if symbols.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "股票代码列表不能为空（如 SH600000,SZ000001）",
            "data": [],
            "count": 0
        }));
    }

    // 2. 调用爬取函数获取原始数据
    let raw_response = fetch_raw_batch_quote(&app, &symbols).await?;

    // 3. 解析原始数据（提取有效 Quote，过滤 None）
    let RawBatchQuoteData { items } = raw_response.data;
    let valid_quotes: Vec<StockQuote> = items
        .into_iter()
        .filter_map(|item: RawBatchQuoteItem| item.quote) // 只保留有数据的 quote
        .collect();

    // 4. 处理空数据场景（匹配 Python 的 "cookie已过期" 提示）
    if valid_quotes.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "未获取到有效报价数据（Cookie可能已过期或代码无效）",
            "data": [],
            "count": 0
        }));
    }

    // 5. 返回成功 JSON（匹配 Python 响应格式）
    Ok(serde_json::json!({
        "success": true,
        "message": format!("成功获取 {} 只股票的报价数据", valid_quotes.len()),
        "data": valid_quotes,
        "count": valid_quotes.len()
    }))
}

/// Command：获取单只股票详情（对应 Python 的 get_stock_details）
#[command]
pub async fn get_single_stock_detail(
    app: AppHandle,
    code: &str, // 单个股票代码（如 "SH600000"）
) -> Result<serde_json::Value, String> {
    // 1. 参数校验（修剪空格 + 大写转换）
    if code.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "股票代码不能为空（如 SH600000）",
            "data": {},
            "count": 0
        }));
    }

    // 2. 调用爬取函数获取原始数据
    let raw_response = fetch_raw_stock_detail(&app, &code).await?;

    // 3. 解析原始数据（提取 quote，处理空数据）
    let RawStockDetailData { quote } = raw_response.data;
    let stock_detail = match quote {
        Some(detail) => detail,
        None => {
            return Ok(serde_json::json!({
                "success": false,
                "message": format!("未获取到 {} 的详情数据（Cookie可能已过期）", code),
                "data": {},
                "count": 0
            }));
        }
    };

    // 4. 返回成功 JSON
    Ok(serde_json::json!({
        "success": true,
        "message": format!("成功获取 {} 的详情数据", code),
        "data": stock_detail,
        "count": 1 // 单只股票，count 固定为 1
    }))
}

#[command]
pub async fn get_minute_chart(app: AppHandle, code: &str) -> Result<serde_json::Value, String> {
    if code.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": "股票代码不能为空（如 SH600009）",
            "data": {},
            "count": 0
        }));
    }

    // 2. 调用爬取函数获取原始数据
    // 这里调用的是我们上一步实现的 fetch_minute_chart
    let raw_response: MinuteChartResponse = fetch_minute_chart(&app, &code).await?;

    // 3. 提取数据并准备返回（处理空数据的情况）
    let items = raw_response.data.items;
    let count = items.len();

    if items.is_empty() {
        return Ok(serde_json::json!({
            "success": false,
            "message": format!("未获取到 {} 的分时数据（可能非交易日或股票停牌）", code),
            "data": {},
            "count": 0
        }));
    }

    // 4. 返回成功 JSON
    // 将 items (Vec<MinuteChartItem>) 直接放入 data 字段
    Ok(serde_json::json!({
        "success": true,
        "message": format!("成功获取 {} 的分时数据，共 {} 条", code, count),
        "data": items, // serde_json 会自动将 Vec 序列化为 JSON 数组
        "count": count
    }))
}
