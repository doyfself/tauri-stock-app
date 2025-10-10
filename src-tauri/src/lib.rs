mod command;
mod db;
mod requests;
mod structs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 创建存储实例（用于保存 Cookie）
    tauri::Builder::default()
        .setup(|app| {
            // 在应用启动时自动初始化所有数据库
            match command::common::init_all_databases(app.handle()) {
                Ok(_) => println!("所有数据库初始化成功"),
                Err(e) => eprintln!("数据库初始化失败: {}", e),
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Selection commands
            command::selection_command::get_all_selections_cmd,
            command::selection_command::get_selection_by_code_cmd,
            command::selection_command::add_or_update_selection_cmd,
            command::selection_command::update_selection_sort_cmd,
            command::selection_command::delete_selection_cmd,
            command::selection_command::is_selection_exists_cmd,
            command::stock_command::crawl_and_save_stocks,
            command::stock_command::search_stocks_by_keyword,
            command::app_config_command::save_xueqiu_cookie,
            command::xueqiu_command::get_kline_data,
            command::xueqiu_command::get_batch_stock_quote,
            command::xueqiu_command::get_single_stock_detail,
            command::xueqiu_command::get_minute_chart,
            command::stock_lines_command::add_stock_lines_cmd,
            command::stock_lines_command::query_stock_lines_cmd,
            command::stock_lines_command::delete_stock_line_cmd,
            command::stock_review_command::get_stock_review_list_cmd,
            command::stock_review_command::add_stock_review_cmd,
            command::stock_review_command::get_single_stock_review_cmd,
            command::stock_review_command::delete_stock_review_cmd,
            command::market_analysis_commands::add_market_analysis_cmd,
            command::market_analysis_commands::query_market_analysis_cmd,
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
