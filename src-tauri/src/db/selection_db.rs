use crate::db::common::init_database;
use crate::structs::selection_structs::{Selection, UpdateSelectionSortParams};
use crate::structs::StockError;
use rusqlite::{params, Connection, Error as RusqliteError, OptionalExtension};
use tauri::AppHandle;

/// 获取自选股数据库连接
pub fn get_selection_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "my_selection")
        .map_err(|e| StockError::BusinessError(format!("获取数据库连接失败: {}", e)))
}

/// 获取所有自选股（按 sort 升序排列）
pub fn get_all_selections(app: &AppHandle) -> Result<Vec<Selection>, StockError> {
    // 获取数据库连接
    let conn = get_selection_db_conn(app)?;

    // 准备查询语句
    let mut stmt = conn
        .prepare(
            "SELECT code, name, color, remark, sort 
             FROM my_selection 
             ORDER BY sort ASC",
        )
        .map_err(|e| StockError::DbError(e))?;

    // 执行查询并映射为 Selection 列表
    let selections = stmt
        .query_map([], |row| {
            Ok(Selection {
                code: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                remark: row.get(3)?,
                sort: row.get(4)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<Selection>, RusqliteError>>()
        .map_err(|e| StockError::DbError(e))?;

    Ok(selections)
}

/// 根据股票代码获取单个自选股
pub fn get_selection_by_code(app: &AppHandle, code: &str) -> Result<Option<Selection>, StockError> {
    let conn = get_selection_db_conn(app)?;

    let mut stmt = conn
        .prepare(
            "SELECT code, name, color, remark, sort 
             FROM my_selection 
             WHERE code = ?1",
        )
        .map_err(|e| StockError::DbError(e))?;

    // 使用 optional() 处理“数据不存在”场景（返回 None）
    let selection = stmt
        .query_row(params![code], |row| {
            Ok(Selection {
                code: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                remark: row.get(3)?,
                sort: row.get(4)?,
            })
        })
        .optional()
        .map_err(|e| StockError::DbError(e))?;

    Ok(selection)
}

/// 检查自选股是否存在
pub fn is_selection_exists(app: &AppHandle, code: &str) -> Result<bool, StockError> {
    let conn = get_selection_db_conn(app)?;

    // 查询匹配代码的记录数
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) 
             FROM my_selection 
             WHERE code = ?1",
            params![code],
            |row| row.get(0),
        )
        .map_err(|e| StockError::DbError(e))?;

    Ok(count > 0)
}

/// 批量插入/更新自选股（存在则更新，不存在则插入）
pub fn add_or_update_selection(app: &AppHandle, selection: &Selection) -> Result<(), StockError> {
    let mut conn = get_selection_db_conn(app)?;
    let tx = conn.transaction().map_err(|e| StockError::DbError(e))?;

    // 关键修复：用代码块包裹 stmt 的创建和执行
    {
        // 预编译 SQL 语句（stmt 仅在代码块内借用 tx）
        let mut stmt = tx
            .prepare(
                "INSERT OR REPLACE INTO my_selection 
                 (code, name, color, remark, sort) 
                 VALUES (?1, ?2, ?3, ?4, ?5)",
            )
            .map_err(|e| StockError::DbError(e))?;

        // 执行单条插入/更新
        stmt.execute(params![
            &selection.code,
            &selection.name,
            &selection.color,
            &selection.remark,
            selection.sort
        ])
        .map_err(|e| StockError::DbError(e))?;
    } // 代码块结束，stmt 销毁，释放对 tx 的借用

    // 此时 tx 无借用，可正常提交
    tx.commit().map_err(|e| StockError::DbError(e))?;
    Ok(())
}

/// 更新自选股排序
pub fn update_selection_sort(
    app: &AppHandle,
    params: &UpdateSelectionSortParams,
) -> Result<(), StockError> {
    let mut conn = get_selection_db_conn(app)?;
    let tx = conn.transaction().map_err(|e| StockError::DbError(e))?;

    // 按新顺序更新 sort（index+1 确保 sort 从 1 开始）
    for (index, code) in params.new_order.iter().enumerate() {
        tx.execute(
            "UPDATE my_selection 
             SET sort = ?1 
             WHERE code = ?2",
            params![index + 1, code],
        )
        .map_err(|e| StockError::DbError(e))?;
    }

    tx.commit().map_err(|e| StockError::DbError(e))?;

    Ok(())
}

/// 删除自选股（返回是否删除成功）
pub fn delete_selection(app: &AppHandle, code: &str) -> Result<bool, StockError> {
    let mut conn = get_selection_db_conn(app)?;
    // 使用事务确保删除和排序调整的原子性
    let tx = conn.transaction().map_err(|e| StockError::DbError(e))?;

    // 1. 先获取被删除项的 sort 值（用于后续重新排序）
    let deleted_sort: Option<i32> = tx
        .query_row(
            "SELECT sort FROM my_selection WHERE code = ?1",
            params![code],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| StockError::DbError(e))?;

    // 2. 执行删除操作
    let affected_rows = tx
        .execute("DELETE FROM my_selection WHERE code = ?1", params![code])
        .map_err(|e| StockError::DbError(e))?;

    if affected_rows == 0 {
        tx.rollback()?; // 未删除任何数据，回滚事务
        return Ok(false);
    }

    // 3. 如果存在被删除的排序值，重新调整后续项的排序
    if let Some(deleted_sort) = deleted_sort {
        // 将所有 sort 大于被删除项的记录，sort 值减 1（填补空缺）
        tx.execute(
            "UPDATE my_selection SET sort = sort - 1 WHERE sort > ?1",
            params![deleted_sort],
        )
        .map_err(|e| StockError::DbError(e))?;
    }

    // 4. 提交事务
    tx.commit().map_err(|e| StockError::DbError(e))?;

    Ok(true)
}
