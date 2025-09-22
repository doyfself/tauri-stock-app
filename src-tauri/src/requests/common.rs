use crate::db::app_config_db::get_xueqiu_cookie_from_db;
use crate::db::common::init_database;
use reqwest::{header, Client};
use std::time::Duration;
use tauri::AppHandle;

/// 优化命名：明确函数作用是「创建带请求头的HTTP客户端」
pub fn create_xueqiu_http_client(app: &AppHandle) -> Result<Client, String> {
    // 1. 构建模拟浏览器的请求头
    let mut headers = header::HeaderMap::new();

    // 关键头信息（模拟真实浏览器请求）
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
    ); // 关键：雪球API可能验证来源页，避免被反爬
    headers.insert("Connection", header::HeaderValue::from_static("keep-alive"));
    headers.insert(
        "Upgrade-Insecure-Requests",
        header::HeaderValue::from_static("1"),
    );

    // 2. 从数据库获取雪球Cookie
    let conn = init_database(app, "app_config").map_err(|e| format!("初始化数据库失败: {}", e))?; // 转换数据库错误为String

    let cookie =
        get_xueqiu_cookie_from_db(&conn).map_err(|e| format!("从数据库读取Cookie失败: {}", e))?; // 转换Cookie读取错误

    let cookie_str = match cookie {
        Some(c) => c,
        None => return Err("数据库中未找到雪球Cookie，请先通过前端设置Cookie".to_string()),
    };

    // 3. 将Cookie添加到请求头（验证Cookie格式有效性）
    let cookie_header = header::HeaderValue::from_str(&cookie_str)
        .map_err(|e| format!("Cookie格式无效（可能包含特殊字符）: {}", e))?;
    headers.insert("Cookie", cookie_header);

    // 4. 构建HTTP客户端（关键：用map_err转换reqwest::Error为String）
    let client = Client::builder()
        .timeout(Duration::from_secs(10)) // 10秒超时，避免请求挂起
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36")
        .default_headers(headers) // 应用所有请求头
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?; // 核心修正：转换reqwest错误

    Ok(client)
}
