use crate::db::common::init_database;
use crate::structs::holdings_structs::{
    AddHoldingReq, DeleteHoldingReq, Holding, UpdateHoldingReq,
};
use crate::structs::StockError;
use rusqlite::{params, Connection, Row};
use tauri::AppHandle;

/// 获取持仓数据库连接
fn get_holdings_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "holdings")
        .map_err(|e| StockError::BusinessError(format!("获取持仓数据库连接失败: {}", e)))
}

/// 1. 添加持仓
pub fn add_holding(app: &AppHandle, req: &AddHoldingReq) -> Result<i32, StockError> {
    let conn = get_holdings_db_conn(app)?;

    // 先检查是否已存在该股票的持仓
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM holdings WHERE code = ?1",
            params![req.code.to_uppercase()],
            |row| Ok(row.get::<_, i32>(0)? > 0),
        )
        .map_err(|e| StockError::DbError(e))?;

    if exists {
        return Err(StockError::BusinessError("该股票已有持仓记录".to_string()));
    }

    // 插入新记录并返回自增ID
    let mut stmt = conn
        .prepare(
            "INSERT INTO holdings 
         (code, name, cost, quantity)
         VALUES (?1, ?2, ?3, ?4)
         RETURNING id",
        )
        .map_err(|e| StockError::DbError(e))?;

    let new_id: i32 = stmt
        .query_row(
            params![req.code.to_uppercase(), req.name, req.cost, req.quantity],
            |row| row.get(0),
        )
        .map_err(|e| StockError::DbError(e))?;

    Ok(new_id)
}

/// 2. 删除持仓
pub fn delete_holding(app: &AppHandle, req: &DeleteHoldingReq) -> Result<bool, StockError> {
    let conn = get_holdings_db_conn(app)?;

    let affected_rows = conn
        .execute("DELETE FROM holdings WHERE id = ?1", params![req.id])
        .map_err(|e| StockError::DbError(e))?;

    Ok(affected_rows > 0)
}

/// 3. 更新持仓（成本和数量）
pub fn update_holding(app: &AppHandle, req: &UpdateHoldingReq) -> Result<bool, StockError> {
    let conn = get_holdings_db_conn(app)?;

    let affected_rows = conn
        .execute(
            "UPDATE holdings SET cost = ?1, quantity = ?2 WHERE id = ?3",
            params![req.cost, req.quantity, req.id],
        )
        .map_err(|e| StockError::DbError(e))?;

    Ok(affected_rows > 0)
}

/// 4. 查询所有持仓
pub fn query_holdings(app: &AppHandle) -> Result<Vec<Holding>, StockError> {
    let conn = get_holdings_db_conn(app)?;

    let mut stmt = conn
        .prepare("SELECT id, code, name, cost, quantity FROM holdings ORDER BY id ASC")
        .map_err(|e| StockError::DbError(e))?;

    let holdings = stmt
        .query_map([], |row| {
            Ok(Holding {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                cost: row.get(3)?,
                quantity: row.get(4)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<Holding>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    Ok(holdings)
}
