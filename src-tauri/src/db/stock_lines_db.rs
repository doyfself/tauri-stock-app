use crate::db::common::init_database;
use crate::structs::stock_lines_structs::{AddLineReq, DeleteLineReq, StockLine};
use crate::structs::StockError;
use rusqlite::{params, Connection};
use tauri::AppHandle;

pub fn get_stock_lines_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "stock_lines")
        .map_err(|e| StockError::BusinessError(format!("获取股票画线数据库连接失败: {}", e)))
}

/// 1. 新增线条（只存储需要的字段）
pub fn add_stock_line(app: &AppHandle, req: &AddLineReq) -> Result<i32, StockError> {
    let conn = get_stock_lines_db_conn(app)?;

    // 插入数据并返回自增ID
    let mut stmt = conn
        .prepare(
            "INSERT INTO stock_lines 
         (code, period, x1, y1, x2, y2, width, height)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         RETURNING id", // 直接返回新增的自增ID
        )
        .map_err(|e| StockError::DbError(e))?;

    let new_id: i32 = stmt
        .query_row(
            params![
                req.code.to_uppercase(), // 股票代码统一大写
                req.period,
                req.x1,
                req.y1,
                req.x2,
                req.y2,
                req.width,
                req.height
            ],
            |row| row.get(0),
        )
        .map_err(|e| StockError::DbError(e))?;

    Ok(new_id)
}

/// 2. 查询线条（按code+period筛选，只返回需要的字段）
pub fn query_stock_lines(
    app: &AppHandle,
    code: &str,
    period: &str,
) -> Result<Vec<StockLine>, StockError> {
    let conn = get_stock_lines_db_conn(app)?;

    // 查询并直接映射为StockLine列表
    let mut stmt = conn
        .prepare(
            "SELECT 
            id, code, period, x1, y1, x2, y2, width, height
         FROM stock_lines 
         WHERE code = ?1 AND period = ?2
         ORDER BY id ASC", // 按添加顺序返回
        )
        .map_err(|e| StockError::DbError(e))?;

    let lines = stmt
        .query_map(params![code.to_uppercase(), period], |row| {
            Ok(StockLine {
                id: row.get(0)?,
                code: row.get(1)?,
                period: row.get(2)?,
                x1: row.get(3)?,
                y1: row.get(4)?,
                x2: row.get(5)?,
                y2: row.get(6)?,
                width: row.get(7)?,
                height: row.get(8)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<StockLine>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    Ok(lines)
}

/// 3. 删除线条（按唯一自增ID删除）
pub fn delete_stock_line(app: &AppHandle, req: &DeleteLineReq) -> Result<bool, StockError> {
    let conn = get_stock_lines_db_conn(app)?;

    // 按ID删除，返回是否删除成功
    let affected_rows = conn
        .execute("DELETE FROM stock_lines WHERE id = ?1", params![req.id])
        .map_err(|e| StockError::DbError(e))?;

    Ok(affected_rows > 0)
}
