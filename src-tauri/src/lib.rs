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
            command::selection::get_selection,
            command::selection::get_selection_remark,
            command::selection::add_selection,
            command::selection::is_selection_exists,
            command::selection::update_selection_sort,
            command::selection::delete_selection,
            command::stock_command::crawl_and_save_stocks,
            command::stock_command::search_stocks_by_keyword,
            command::app_config_command::save_xueqiu_cookie,
            command::xueqiu_command::get_kline_data,
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
