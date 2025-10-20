use crate::db::common::init_database;
use crate::structs::market_analysis_structs::{AddMarketAnalysisReq, MarketAnalysis};
use crate::structs::StockError;
use rusqlite::{params, Connection, OptionalExtension};
use tauri::AppHandle;

/// 获取 market_analysis 数据库连接（保持不变）
pub fn get_market_analysis_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "market_analysis")
        .map_err(|e| StockError::BusinessError(format!("获取市场分析数据库连接失败: {}", e)))
}

/// 新增/更新市场分析（修复事务借用冲突）
/// 返回值：(是否为更新操作, 新增/更新后的完整数据)
pub fn add_or_update_market_analysis(
    app: &AppHandle,
    req: &AddMarketAnalysisReq,
) -> Result<(bool, MarketAnalysis), StockError> {
    let mut conn = get_market_analysis_db_conn(app)?;
    let tx = conn.transaction().map_err(|e| StockError::DbError(e))?;

    // 1. 显式查询日期是否存在（使用临时 stmt，查询结束后生命周期自动结束）
    let date_exist: Option<String> = {
        // 用代码块限制 stmt 生命周期：代码块结束后，stmt 销毁，释放 tx 的借用
        let mut exist_stmt = tx
            .prepare("SELECT date FROM market_analysis WHERE date = ?1")
            .map_err(|e| StockError::DbError(e))?;
        exist_stmt
            .query_row(params![&req.date], |row| row.get(0))
            .optional()
            .map_err(|e| StockError::DbError(e))?
    };

    // 2. 根据日期是否存在，执行更新或新增（此时 tx 已无借用，可创建新 stmt）
    let (is_update, result) = match date_exist {
        // 日期存在：执行更新
        Some(_) => {
            let mut update_stmt = tx
                .prepare(
                    "UPDATE market_analysis 
                 SET analysis = ?1, status = ?2 
                 WHERE date = ?3 
                 RETURNING date, analysis, status",
                )
                .map_err(|e| StockError::DbError(e))?;

            let updated = update_stmt
                .query_row(params![&req.analysis, &req.status, &req.date], |row| {
                    Ok(MarketAnalysis {
                        date: row.get(0)?,
                        analysis: row.get(1)?,
                        status: row.get(2)?,
                    })
                })
                .map_err(|e| StockError::DbError(e))?;

            (true, updated)
        }
        // 日期不存在：执行新增
        None => {
            let mut insert_stmt = tx
                .prepare(
                    "INSERT INTO market_analysis (date, analysis, status) 
                 VALUES (?1, ?2, ?3) 
                 RETURNING date, analysis, status",
                )
                .map_err(|e| StockError::DbError(e))?;

            let inserted = insert_stmt
                .query_row(params![&req.date, &req.analysis, &req.status], |row| {
                    Ok(MarketAnalysis {
                        date: row.get(0)?,
                        analysis: row.get(1)?,
                        status: row.get(2)?,
                    })
                })
                .map_err(|e| StockError::DbError(e))?;

            (false, inserted)
        }
    };

    // 3. 提交事务（此时所有 stmt 已销毁，无借用冲突）
    tx.commit().map_err(|e| StockError::DbError(e))?;

    Ok((is_update, result))
}

/// 查询最后10条市场分析（保持不变，无借用问题）
pub fn query_last_10_market_analysis(
    app: &AppHandle,
) -> Result<Option<Vec<MarketAnalysis>>, StockError> {
    let conn = get_market_analysis_db_conn(app)?;
    let mut stmt = conn
        .prepare(
            "SELECT date, analysis, status 
         FROM market_analysis 
         ORDER BY date DESC 
         LIMIT 6",
        )
        .map_err(|e| StockError::DbError(e))?;

    let analysis_list = stmt
        .query_map([], |row| {
            Ok(MarketAnalysis {
                date: row.get(0)?,
                analysis: row.get(1)?,
                status: row.get(2)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<MarketAnalysis>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    Ok(if analysis_list.is_empty() {
        None
    } else {
        Some(analysis_list)
    })
}
