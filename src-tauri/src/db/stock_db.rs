use crate::structs::stock_structs::{StockError, StockItem};
impl From<StockError> for String {
    fn from(err: StockError) -> Self {
        err.to_string()
    }
}

// -------------------------- 3. 数据库操作封装 --------------------------
/// 初始化股票数据库表（若不存在则创建）
pub fn init_stock_db(conn: &rusqlite::Connection) -> Result<(), StockError> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS all_stocks (
            symbol TEXT PRIMARY KEY,  -- 股票代码作为主键（避免重复）
            name TEXT NOT NULL       -- 股票名称
        )",
        [],
    )?;
    Ok(())
}

/// 批量插入/更新股票数据（存在则更新名称和时间，不存在则插入）
pub fn batch_upsert_stocks(
    conn: &mut rusqlite::Connection,
    stocks: &[StockItem],
) -> Result<usize, StockError> {
    // 使用事务确保原子性（要么全部成功，要么全部失败）
    let tx = conn.transaction()?;

    // 批量执行（循环插入所有股票）
    let mut count = 0;

    // 添加作用域限制 stmt 的生命周期
    {
        // 准备 SQL（INSERT OR REPLACE：存在则替换，不存在则插入）
        let mut stmt = tx.prepare(
            "INSERT OR REPLACE INTO all_stocks (symbol, name)
             VALUES (?1, ?2)",
        )?;

        for stock in stocks {
            stmt.execute((stock.symbol.as_str(), stock.name.as_str()))?;
            count += 1;
        }
    } // 到这里 stmt 会被销毁，释放对 tx 的借用

    tx.commit()?; // 现在可以安全提交事务了
    Ok(count) // 返回成功插入/更新的条数
}

/// 模糊查询股票（仅需keyword，返回所有匹配结果）
pub fn fuzzy_search_stocks_by_keyword(
    conn: &rusqlite::Connection,
    keyword: &str,
) -> Result<Vec<StockItem>, StockError> {
    // 构建模糊查询的参数（包含通配符%）
    let pattern = format!("%{}%", keyword);

    // 查询所有符合条件的股票（不限制数量）
    let mut stmt = conn.prepare(
        "SELECT symbol, name 
         FROM all_stocks 
         WHERE symbol LIKE ?1 OR name LIKE ?1 
         ORDER BY symbol", // 按股票代码排序
    )?;

    let stocks = stmt
        .query_map([pattern.as_str()], |row| {
            Ok(StockItem {
                symbol: row.get(0)?,
                name: row.get(1)?,
            })
        })?
        .collect::<Result<Vec<StockItem>, rusqlite::Error>>()?;

    Ok(stocks)
}
