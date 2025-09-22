use crate::requests::common::create_xueqiu_http_client;
use crate::structs::xueqiu_structs::RawKlineResponse;
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
