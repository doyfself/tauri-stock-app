use crate::structs::stock_structs::{StockApiResponse, StockError, StockItem};
use reqwest::{header, Client};
use std::time::Duration;

/// 爬取所有 A 股股票数据（分页请求雪球 API）
pub async fn crawl_all_stocks() -> Result<Vec<StockItem>, StockError> {
    // 1. 构建客户端时添加完整请求头，模拟真实浏览器
    let mut headers = header::HeaderMap::new();

    // 关键头信息（从浏览器开发者工具获取）
    headers.insert(
        "Accept",
        header::HeaderValue::from_static(
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        ),
    );
    headers.insert(
        "Accept-Language",
        header::HeaderValue::from_static(
            "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
        ),
    );
    headers.insert(
        "Referer",
        header::HeaderValue::from_static("https://xueqiu.com/"),
    ); // 关键：添加来源页
    headers.insert("Connection", header::HeaderValue::from_static("keep-alive"));
    headers.insert(
        "Upgrade-Insecure-Requests",
        header::HeaderValue::from_static("1"),
    );

    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36")
        .default_headers(headers)  // 应用上述头信息
        .build()?;

    // 2. 先请求第 1 页，获取总数据条数（count）
    let first_page_url = "https://stock.xueqiu.com/v5/stock/screener/quote/list.json?page=1&size=90&order=desc&order_by=percent&market=CN&type=sh_sz";
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
            "https://stock.xueqiu.com/v5/stock/screener/quote/list.json?page={}&size=90&order=desc&order_by=percent&market=CN&type=sh_sz",
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
