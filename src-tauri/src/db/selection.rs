use rusqlite::{params, Connection, OptionalExtension, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Selection {
    pub code: String,
    pub name: String,
    pub color: String,
    pub remark: String,
    pub sort: i32,
}

/// 初始化数据库连接并创建表（如果不存在）
pub fn init_db() -> Result<Connection, String> {
    // 连接到数据库，如果不存在则创建
    let conn = Connection::open("selection.db").map_err(|e| e.to_string())?;

    // 创建自选表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS selection (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            remark TEXT NOT NULL,
            sort INTEGER NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

/// 获取所有自选项目
pub fn get_all_selections() -> Result<Vec<Selection>, String> {
    let conn = init_db()?;
    let mut stmt = conn
        .prepare("SELECT code, name, color, remark, sort FROM selection ORDER BY sort")
        .map_err(|e| e.to_string())?;

    let selection_iter = stmt
        .query_map([], |row| {
            Ok(Selection {
                code: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                remark: row.get(3)?,
                sort: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut selections = Vec::new();
    for selection in selection_iter {
        selections.push(selection.map_err(|e| e.to_string())?);
    }

    Ok(selections)
}

/// 根据代码获取自选项目
pub fn get_selection_by_code(code: &str) -> Result<Option<Selection>, String> {
    let conn = init_db()?;
    let mut stmt = conn
        .prepare("SELECT code, name, color, remark, sort FROM selection WHERE code = ?1")
        .map_err(|e| e.to_string())?;

    let result = stmt
        .query_row(params![code], |row| {
            // 闭包内部保持错误为 rusqlite::Error 类型
            Ok(Selection {
                code: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                remark: row.get(3)?,
                sort: row.get(4)?,
            })
        })
        .optional() // 现在 optional() 接收的是 rusqlite::Error 类型
        .map_err(|e| e.to_string())?; // 在这里统一转换为 String 错误

    Ok(result)
}

/// 检查自选项目是否存在
pub fn is_selection_exists(code: &str) -> Result<bool, String> {
    let conn = init_db()?;
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM selection WHERE code = ?1",
            params![code],
            |row| row.get(0), // 这里直接返回 rusqlite::Result<i64>
        )
        .map_err(|e| e.to_string())?; // 在这里统一转换为 String 错误

    Ok(count > 0)
}

/// 添加或更新自选项目
pub fn add_or_update_selection(selection: &Selection) -> Result<(), String> {
    let conn = init_db()?;

    // 检查是否存在
    let exists = is_selection_exists(&selection.code)?;

    if exists {
        // 更新现有记录
        conn.execute(
            "UPDATE selection SET name = ?1, color = ?2, remark = ?3, sort = ?4 WHERE code = ?5",
            params![
                selection.name,
                selection.color,
                selection.remark,
                selection.sort,
                selection.code
            ],
        )
        .map_err(|e| e.to_string())?;
    } else {
        // 插入新记录
        conn.execute(
            "INSERT INTO selection (code, name, color, remark, sort) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                selection.code,
                selection.name,
                selection.color,
                selection.remark,
                selection.sort
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// 更新自选项目排序
pub fn update_selection_sort(new_order: &[String]) -> Result<(), String> {
    let mut conn = init_db()?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for (index, code) in new_order.iter().enumerate() {
        tx.execute(
            "UPDATE selection SET sort = ?1 WHERE code = ?2",
            params![index + 1, code],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/// 删除自选项目
pub fn delete_selection(code: &str) -> Result<bool, String> {
    let conn = init_db()?;
    let result = conn
        .execute("DELETE FROM selection WHERE code = ?1", params![code])
        .map_err(|e| e.to_string())?;

    Ok(result > 0)
}
