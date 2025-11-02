use crate::structs::stock_structs::StockItem;
use crate::structs::StockError;
impl From<StockError> for String {
    fn from(err: StockError) -> Self {
        err.to_string()
    }
}

pub fn clear_stocks_table(conn: &mut rusqlite::Connection) -> Result<usize, StockError> {
    let tx = conn.transaction()?;

    let affected_rows = {
        let mut stmt = tx.prepare("DELETE FROM all_stocks")?;
        stmt.execute([])?
    }; // 到这里 stmt 被销毁，释放对 tx 的借用

    tx.commit()?;
    Ok(affected_rows)
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
    // 构建查询模式
    let contain_pattern = format!("%{}%", keyword); // 包含关键词

    // 优化的SQL查询：
    // 1. 忽略前缀(sh/sz)，从第三位开始匹配代码
    // 2. 优先显示代码中从第三位开始以关键词开头的记录
    // 3. 其次显示名称以关键词开头的记录
    // 4. 最后显示其他包含关键词的记录
    // 5. 限制返回10条结果
    let mut stmt = conn.prepare(
        "SELECT symbol, name 
         FROM all_stocks 
         WHERE 
             -- 匹配条件：代码(忽略前缀)或名称包含关键词
             (SUBSTR(symbol, 3) LIKE ?1) OR  -- 从第三位开始匹配代码
             name LIKE ?1
         ORDER BY 
             -- 优先级1：代码从第三位开始以关键词开头
             CASE WHEN SUBSTR(symbol, 3) LIKE ?2 THEN 0 ELSE 1 END,
             -- 优先级2：名称以关键词开头
             CASE WHEN name LIKE ?2 THEN 0 ELSE 1 END,
             -- 最后按股票代码排序
             symbol
         LIMIT 10",
    )?;

    // 参数说明：
    // ?1: %keyword% 用于匹配包含关键词的记录
    // ?2: keyword% 用于匹配以关键词开头的记录
    let stocks = stmt
        .query_map(
            [contain_pattern.as_str(), format!("{}%", keyword).as_str()],
            |row| {
                Ok(StockItem {
                    symbol: row.get(0)?,
                    name: row.get(1)?,
                })
            },
        )?
        .collect::<Result<Vec<StockItem>, rusqlite::Error>>()
        .map_err(StockError::DbError)?;

    Ok(stocks)
}
