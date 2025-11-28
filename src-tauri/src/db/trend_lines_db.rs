use crate::db::common::init_database;
use crate::structs::trend_lines_structs::{AddTrendLineReq, DeleteTrendLineReq, TrendLine};
use crate::structs::StockError;
use rusqlite::{params, Connection};
use tauri::AppHandle;

/// 获取 trend_lines 数据库连接
pub fn get_trend_lines_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "trend_lines")
        .map_err(|e| StockError::BusinessError(format!("获取趋势线数据库连接失败: {}", e)))
}

/// 1. 新增趋势线（斜线）
pub fn add_trend_line(app: &AppHandle, req: &AddTrendLineReq) -> Result<i32, StockError> {
    let conn = get_trend_lines_db_conn(app)?;

    let mut stmt = conn
        .prepare(
            "INSERT INTO trend_lines 
             (code, period, start_time, start_price, end_time, end_price)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             RETURNING id",
        )
        .map_err(|e| StockError::DbError(e))?;

    let new_id: i32 = stmt
        .query_row(
            params![
                req.code.to_uppercase(),
                req.period,
                req.start_time,
                req.start_price,
                req.end_time,
                req.end_price,
            ],
            |row| row.get(0),
        )
        .map_err(|e| StockError::DbError(e))?;

    Ok(new_id)
}

/// 2. 查询趋势线（按 code + period）
pub fn query_trend_lines(
    app: &AppHandle,
    code: &str,
    period: &str,
) -> Result<Vec<TrendLine>, StockError> {
    let conn = get_trend_lines_db_conn(app)?;

    let mut stmt = conn
        .prepare(
            "SELECT 
                id, code, period, start_time, start_price, end_time, end_price
             FROM trend_lines 
             WHERE code = ?1 AND period = ?2
             ORDER BY id ASC",
        )
        .map_err(|e| StockError::DbError(e))?;

    let lines = stmt
        .query_map(params![code.to_uppercase(), period], |row| {
            Ok(TrendLine {
                id: row.get(0)?,
                code: row.get(1)?,
                period: row.get(2)?,
                start_time: row.get(3)?,
                start_price: row.get(4)?,
                end_time: row.get(5)?,
                end_price: row.get(6)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<TrendLine>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    Ok(lines)
}

/// 3. 删除趋势线（按 ID）
pub fn delete_trend_line(app: &AppHandle, req: &DeleteTrendLineReq) -> Result<bool, StockError> {
    let conn = get_trend_lines_db_conn(app)?;

    let affected_rows = conn
        .execute("DELETE FROM trend_lines WHERE id = ?1", params![req.id])
        .map_err(|e| StockError::DbError(e))?;

    Ok(affected_rows > 0)
}
