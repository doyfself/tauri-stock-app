use crate::db::common::init_database;
use crate::structs::holdings_structs::{AddHoldingReq, Holding, PagedResult, UpdateHoldingReq};
use crate::structs::StockError;
use rusqlite::{params, Connection};
use tauri::AppHandle;

/// 获取持仓数据库连接
fn get_holdings_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "holdings")
        .map_err(|e| StockError::BusinessError(format!("获取持仓数据库连接失败: {}", e)))
}

/// 1. 添加持仓（必须传入hold_time，新增status字段）
pub fn add_holding(app: &AppHandle, req: &AddHoldingReq) -> Result<i32, StockError> {
    let conn = get_holdings_db_conn(app)?;

    // 检查股票是否已存在且为当前持仓
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM holdings WHERE code = ?1 AND status = 1",
            params![req.code.to_uppercase()],
            |row| Ok(row.get::<_, i32>(0)? > 0),
        )
        .map_err(|e| StockError::DbError(e))?;

    if exists {
        return Err(StockError::BusinessError("该股票已有持仓记录".to_string()));
    }

    // 插入新记录（含hold_time和status）
    let mut stmt = conn
        .prepare(
            "INSERT INTO holdings 
         (code, name, cost, quantity, hold_time, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         RETURNING id",
        )
        .map_err(|e| StockError::DbError(e))?;

    let new_id: i32 = stmt
        .query_row(
            params![
                req.code.to_uppercase(),
                req.name,
                req.cost,
                req.quantity,
                req.hold_time,
                1 // status = 1 表示当前持仓
            ],
            |row| row.get(0),
        )
        .map_err(|e| StockError::DbError(e))?;

    Ok(new_id)
}

/// 3. 更新持仓（可以更新所有字段）
pub fn update_holding(app: &AppHandle, req: &UpdateHoldingReq) -> Result<bool, StockError> {
    let conn = get_holdings_db_conn(app)?;

    let affected_rows = conn
        .execute(
            "UPDATE holdings SET 
             cost = ?1, 
             quantity = ?2, 
             status = ?3,
             sell_time = ?4,
             sell_price = ?5,
             profit = ?6
             WHERE id = ?7",
            params![
                req.cost,
                req.quantity,
                req.status,
                req.sell_time,
                req.sell_price,
                req.profit,
                req.id
            ],
        )
        .map_err(|e| StockError::DbError(e))?;

    Ok(affected_rows > 0)
}

/// 4. 查询所有当前持仓（status = 1）
pub fn query_holdings(app: &AppHandle) -> Result<Vec<Holding>, StockError> {
    let conn = get_holdings_db_conn(app)?;

    let mut stmt = conn
        .prepare(
            "SELECT id, code, name, cost, quantity, hold_time, status, sell_time, sell_price, profit 
             FROM holdings 
             WHERE status = 1 
             ORDER BY id ASC",
        )
        .map_err(|e| StockError::DbError(e))?;

    let holdings = stmt
        .query_map([], |row| {
            Ok(Holding {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                cost: row.get(3)?,
                quantity: row.get(4)?,
                hold_time: row.get(5)?,
                status: row.get(6)?,
                sell_time: row.get(7)?,
                sell_price: row.get(8)?,
                profit: row.get(9)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<Holding>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    Ok(holdings)
}

pub fn query_history_holdings(
    app: &AppHandle,
    page: i32,
    page_size: i32,
) -> Result<PagedResult<Holding>, StockError> {
    let conn = get_holdings_db_conn(app)?;

    // 计算偏移量
    let offset = (page - 1) * page_size;

    // 首先查询总记录数
    let total: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM holdings WHERE status = 0",
            [],
            |row| row.get(0),
        )
        .map_err(|e| StockError::DbError(e))?;

    // 查询分页数据
    let mut stmt = conn
        .prepare(
            "SELECT id, code, name, cost, quantity, hold_time, status, sell_time, sell_price, profit 
             FROM holdings 
             WHERE status = 0 
             ORDER BY sell_time DESC
             LIMIT ?1 OFFSET ?2",
        )
        .map_err(|e| StockError::DbError(e))?;

    let holdings = stmt
        .query_map(params![page_size, offset], |row| {
            Ok(Holding {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                cost: row.get(3)?,
                quantity: row.get(4)?,
                hold_time: row.get(5)?,
                status: row.get(6)?,
                sell_time: row.get(7)?,
                sell_price: row.get(8)?,
                profit: row.get(9)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<Holding>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    // 计算总页数
    let total_pages = (total as f64 / page_size as f64).ceil() as i32;

    Ok(PagedResult {
        data: holdings,
        total,
        page,
        page_size,
        total_pages,
    })
}

/// 6. 根据股票代码获取最近的持仓数据
pub fn query_latest_holding_by_code(
    app: &AppHandle,
    code: &str,
) -> Result<Option<Holding>, StockError> {
    let conn = get_holdings_db_conn(app)?;

    // 先查询当前持仓，如果没有则查询最近的历史记录
    let mut stmt = conn
        .prepare(
            "SELECT id, code, name, cost, quantity, hold_time, status, sell_time, sell_price, profit 
             FROM holdings 
             WHERE code = ?1 
             ORDER BY 
                 CASE WHEN status = 1 THEN 0 ELSE 1 END, -- 当前持仓优先
                 COALESCE(sell_time, hold_time) DESC -- 按时间倒序
             LIMIT 1",
        )
        .map_err(|e| StockError::DbError(e))?;

    let result = stmt.query_row(params![code.to_uppercase()], |row| {
        Ok(Holding {
            id: row.get(0)?,
            code: row.get(1)?,
            name: row.get(2)?,
            cost: row.get(3)?,
            quantity: row.get(4)?,
            hold_time: row.get(5)?,
            status: row.get(6)?,
            sell_time: row.get(7)?,
            sell_price: row.get(8)?,
            profit: row.get(9)?,
        })
    });

    match result {
        Ok(holding) => Ok(Some(holding)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(StockError::DbError(e)),
    }
}
