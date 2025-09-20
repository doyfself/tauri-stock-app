mod command;
mod db;
mod requests;
mod structs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 创建存储实例（用于保存 Cookie）
    tauri::Builder::default()
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
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
