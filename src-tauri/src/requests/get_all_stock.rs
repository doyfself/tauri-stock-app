use super::common::create_xueqiu_http_client;
use crate::structs::stock_structs::{StockApiResponse, StockItem};
use crate::structs::StockError;
use reqwest::Client;
use std::time::Duration;

/// 爬取所有 A 股股票数据（分页请求雪球 API）
pub async fn crawl_all_stocks(app: tauri::AppHandle) -> Result<Vec<StockItem>, StockError> {
    let client: Client =
        create_xueqiu_http_client(&app).map_err(|err_str| StockError::BusinessError(err_str))?;

    // 2. 先请求第 1 页，获取总数据条数（count）
    let first_page_url = "https://xueqiu.com/service/screener/screen?category=CN&exchange=sh_sz&areacode=&indcode=&order_by=symbol&order=desc&page=1&size=90&only_count=0";
    let first_response = client.get(first_page_url).send().await?;
    println!("响应状态: {}", first_response.status());

    // 检查响应状态（如 403/404 等错误）
    if !first_response.status().is_success() {
        return Err(StockError::BusinessError(format!(
            "API 请求失败，状态码: {}",
            first_response.status()
        )));
    }

    // 解析第 1 页响应，获取总条数和第 1 页数据
    let first_api_data: StockApiResponse = first_response.json().await?;
    let total_count = first_api_data.data.count;
    let mut all_stocks = first_api_data.data.list;

    // 3. 计算总页数（size=90，向上取整）
    let total_pages = if total_count % 90 == 0 {
        total_count / 90
    } else {
        total_count / 90 + 1
    };

    // 4. 循环爬取剩余页面（从第 2 页开始）
    for page in 2..=total_pages {
        let url = format!(
            "https://xueqiu.com/service/screener/screen?category=CN&exchange=sh_sz&areacode=&indcode=&order_by=symbol&order=desc&page={}&size=90&only_count=0",
            page
        );

        // 可选：添加小延迟（避免请求过于频繁被反爬）
        tokio::time::sleep(Duration::from_millis(500)).await;

        // 请求当前页
        let response = client.get(&url).send().await?;
        if !response.status().is_success() {
            eprintln!("爬取第 {} 页失败，状态码: {}", page, response.status());
            continue; // 跳过失败页面，继续爬取下一页
        }

        // 解析当前页数据并添加到总列表
        let api_data: StockApiResponse = response.json().await?;
        all_stocks.extend(api_data.data.list);
    }

    // 去重（避免 API 可能返回的重复数据）
    all_stocks.sort_by_key(|s| s.symbol.clone());
    all_stocks.dedup_by_key(|s| s.symbol.clone());

    Ok(all_stocks)
}
