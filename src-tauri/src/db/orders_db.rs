use crate::db::common::init_database;
use crate::structs::orders_structs::{AddOrderParams, Order, PaginatedOrders, QueryOrdersParams};
use crate::structs::StockError;
use rusqlite::{params, Connection};
use tauri::AppHandle;

/// 获取委托数据库连接
pub fn get_orders_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "orders")
        .map_err(|e| StockError::BusinessError(format!("获取委托数据库连接失败: {}", e)))
}

/// 添加委托
pub fn add_order(app: &AppHandle, req: &AddOrderParams) -> Result<i32, StockError> {
    let conn = get_orders_db_conn(app)?;

    // 插入新记录并返回自增ID
    let mut stmt = conn
        .prepare(
            "INSERT INTO orders 
         (code, name, time, quantity, cost, action)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         RETURNING id",
        )
        .map_err(|e| StockError::DbError(e))?;

    let new_id: i32 = stmt
        .query_row(
            params![
                req.code.to_uppercase(),
                req.name,
                req.time,
                req.quantity,
                req.cost,
                req.action
            ],
            |row| row.get(0),
        )
        .map_err(|e| StockError::DbError(e))?;

    Ok(new_id)
}

/// 查询所有委托（按时间倒序，最新的在前）
pub fn query_orders(
    app: &AppHandle,
    params: &QueryOrdersParams,
) -> Result<PaginatedOrders, StockError> {
    let conn = get_orders_db_conn(app)?;

    // 计算偏移量
    let offset = (params.page - 1) * params.page_size;

    // 查询总记录数
    let total: i32 = conn
        .query_row("SELECT COUNT(*) FROM orders", [], |row| row.get(0))
        .map_err(|e| StockError::DbError(e))?;

    // 查询分页数据
    let mut stmt = conn
        .prepare(
            "SELECT id, code, name, time, quantity, cost, action 
             FROM orders 
             ORDER BY time DESC, id DESC 
             LIMIT ?1 OFFSET ?2",
        )
        .map_err(|e| StockError::DbError(e))?;

    let orders = stmt
        .query_map([params.page_size, offset], |row| {
            Ok(Order {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                time: row.get(3)?,
                quantity: row.get(4)?,
                cost: row.get(5)?,
                action: row.get(6)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<Order>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    // 计算总页数
    let total_pages = (total as f64 / params.page_size as f64).ceil() as i32;

    Ok(PaginatedOrders {
        orders,
        total,
        page: params.page,
        page_size: params.page_size,
        total_pages,
    })
}
