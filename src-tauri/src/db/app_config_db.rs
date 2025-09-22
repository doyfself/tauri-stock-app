use crate::structs::StockError;
use rusqlite::{Connection, Result};
// 保存雪球 Cookie 到数据库
pub fn save_xueqiu_cookie_to_db(conn: &mut Connection, cookie: &str) -> Result<(), StockError> {
    // 使用 INSERT OR REPLACE：存在则更新，不存在则插入
    conn.execute(
        "INSERT OR REPLACE INTO app_config (key, value) VALUES (?1, ?2)",
        ["xueqiu_cookie", cookie],
    )
    .map_err(|e| StockError::DbError(e))?;

    Ok(())
}

// 从数据库读取雪球 Cookie
pub fn get_xueqiu_cookie_from_db(conn: &Connection) -> Result<Option<String>, StockError> {
    let mut stmt = conn
        .prepare("SELECT value FROM app_config WHERE key = 'xueqiu_cookie'")
        .map_err(|e| StockError::DbError(e))?;

    // 查询结果：如果存在则返回 Some(cookie)，否则返回 None
    let cookie: Option<String> = stmt.query_row([], |row| row.get(0)).ok(); // 用 ok() 把 Err 转为 None（表示没有记录）

    Ok(cookie)
}
