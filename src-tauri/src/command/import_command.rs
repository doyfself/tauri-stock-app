use crate::db::import_db::import_single_database;
use rusqlite::Result;
use std::fs::File;
use std::io::Read;
use tauri::AppHandle;
use zip::ZipArchive;
// 添加数据库导入功能
#[tauri::command]
pub async fn import_database(app: AppHandle, zip_data: Vec<u8>) -> Result<String, String> {
    // 创建临时目录
    let temp_dir = tempfile::tempdir().map_err(|e| format!("创建临时目录失败: {}", e))?;
    let zip_path = temp_dir.path().join("backup.zip");

    // 写入压缩包数据
    std::fs::write(&zip_path, zip_data).map_err(|e| format!("写入临时文件失败: {}", e))?;

    // 打开压缩包
    let file = File::open(&zip_path).map_err(|e| format!("打开压缩包失败: {}", e))?;
    let mut archive = ZipArchive::new(file).map_err(|e| format!("读取压缩包失败: {}", e))?;

    // 打印压缩包中的所有文件，用于调试
    println!("压缩包中的文件列表 (总数: {}):", archive.len());
    for i in 0..archive.len() {
        let file = archive.by_index(i).unwrap();
        println!("- {} (大小: {} 字节)", file.name(), file.size());
    }

    // 定义需要导入的数据库文件列表
    let db_files = [
        "app_config",
        "all_stocks",
        "my_selection",
        "stock_review",
        "self_reflect",
        "market_analysis",
        "stock_lines",
        "holdings",
        "orders",
    ];

    let mut imported_count = 0;
    let mut found_files = Vec::new();

    // 方法1: 尝试精确匹配文件名
    for db_name in db_files.iter() {
        // 尝试多种可能的文件路径格式
        let possible_paths = [
            format!("databases/{}.db", db_name), // 子目录中的文件
            format!("{}.db", db_name),           // 根目录中的文件
            format!("databases/{}", db_name),    // 子目录中无扩展名
            format!("{}", db_name),              // 根目录中无扩展名
        ];

        let mut found = false;

        for path in &possible_paths {
            match archive.by_name(path) {
                Ok(mut file) => {
                    // 忽略 macOS 系统文件
                    if path.contains("__MACOSX") || path.contains(".DS_Store") {
                        continue;
                    }

                    println!("找到数据库文件: {}", path);
                    found_files.push(path.clone());

                    // 读取数据库文件内容
                    let mut db_data = Vec::new();
                    file.read_to_end(&mut db_data)
                        .map_err(|e| format!("读取数据库文件 {} 失败: {}", path, e))?;

                    // 导入数据到当前数据库
                    if let Err(e) = import_single_database(&app, db_name, &db_data) {
                        eprintln!("导入数据库 {} 失败: {}", db_name, e);
                        // 继续导入其他数据库，不中断整个流程
                        break;
                    }

                    imported_count += 1;
                    println!("成功导入数据库: {}", db_name);
                    found = true;
                    break;
                }
                Err(_) => {
                    // 继续尝试下一个可能的路径
                    continue;
                }
            }
        }

        if !found {
            println!("未找到数据库: {}", db_name);
        }
    }

    // 如果上述方法没有找到文件，尝试遍历所有文件并匹配
    if imported_count == 0 {
        println!("尝试遍历所有文件查找数据库...");

        // 首先收集所有匹配的文件索引和对应的数据库名称
        let mut matches = Vec::new();
        for i in 0..archive.len() {
            let file = archive.by_index(i).unwrap();
            let file_path = file.name().to_string();

            // 忽略 macOS 系统文件
            if file_path.contains("__MACOSX") || file_path.contains(".DS_Store") {
                continue;
            }

            // 检查文件名是否包含数据库名称
            for db_name in db_files.iter() {
                if file_path.contains(db_name)
                    && (file_path.ends_with(".db") || !file_path.contains('.'))
                {
                    println!("匹配到数据库文件: {} -> {}", file_path, db_name);
                    matches.push((i, db_name.to_string(), file_path.clone()));
                    break;
                }
            }
        }

        // 然后处理所有匹配的文件
        for (i, db_name, file_path) in matches {
            // 重新获取文件引用
            let mut file = archive
                .by_index(i)
                .map_err(|e| format!("重新获取文件 {} 失败: {}", file_path, e))?;

            // 读取数据库文件内容
            let mut db_data = Vec::new();
            file.read_to_end(&mut db_data)
                .map_err(|e| format!("读取数据库文件 {} 失败: {}", file_path, e))?;

            // 导入数据到当前数据库
            if let Err(e) = import_single_database(&app, &db_name, &db_data) {
                eprintln!("导入数据库 {} 失败: {}", db_name, e);
                continue;
            }

            imported_count += 1;
            found_files.push(file_path);
            println!("成功导入数据库: {}", db_name);
        }
    }

    // 打印找到的文件列表
    println!("成功找到的文件: {:?}", found_files);

    if imported_count == 0 {
        return Err(
            "在压缩包中未找到任何数据库文件。请确保压缩包包含正确的数据库文件。".to_string(),
        );
    }

    Ok(format!(
        "成功导入 {}/{} 个数据库",
        imported_count,
        db_files.len()
    ))
}

// ... 其他函数保持不变 ...
