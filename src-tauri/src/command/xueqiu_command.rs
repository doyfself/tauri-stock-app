use crate::requests::xueqiu_request::fetch_raw_kline_data;
use crate::structs::xueqiu_structs::{GetStockDataParams, RawKlineData, StockKlineItem};
use chrono::{DateTime, Utc};
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
        let date_str = if timestamp > 0 {
            DateTime::from_timestamp_millis(timestamp)
                .unwrap_or(Utc::now())
                .format("%Y-%m-%d %H:%M")
                .to_string()
        } else {
            "".to_string()
        };

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
            date: date_str,
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
