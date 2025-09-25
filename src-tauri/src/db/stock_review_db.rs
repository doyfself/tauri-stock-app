use crate::db::common::init_database;
use crate::structs::stock_review_structs::{
    AddReviewReq, GetOrDeleteReviewReq, GetReviewListReq, StockReview, StockReviewListItem,
};
use crate::structs::StockError;
use rusqlite::{params, Connection, OptionalExtension};
use tauri::AppHandle;

/// 获取 stock_review 数据库连接（沿用项目风格）
pub fn get_stock_review_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "stock_review")
        .map_err(|e| StockError::BusinessError(format!("获取股票评论数据库连接失败: {}", e)))
}

/// 1. 获取评论列表（对应Python的get_stock_review）
/// 支持按类型筛选、标题关键字模糊搜索（不区分大小写）
pub fn get_stock_review_list(
    app: &AppHandle,
    req: &GetReviewListReq,
) -> Result<Vec<StockReviewListItem>, StockError> {
    let conn = get_stock_review_db_conn(app)?;

    // 处理关键字：转为小写，构造模糊搜索条件（%keyword%）
    let keyword = req
        .keyword
        .as_ref()
        .map(|k| format!("%{}%", k.to_lowercase()))
        .unwrap_or_else(|| "%".to_string()); // 无关键字时匹配所有

    // 构造SQL：按类型筛选 + 标题模糊搜索（不区分大小写）
    let mut stmt = conn
        .prepare(
            "SELECT id, title
         FROM stock_review 
         WHERE type = ?1 
           AND LOWER(title) LIKE ?2  -- LOWER()实现不区分大小写搜索
         ORDER BY date DESC", // 按日期倒序，最新评论在前
        )
        .map_err(|e| StockError::DbError(e))?;

    // 执行查询并映射为StockReview列表
    let reviews = stmt
        .query_map(params![&req.r#type, &keyword], |row| {
            Ok(StockReviewListItem {
                id: row.get(0)?,
                title: row.get(1)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<StockReviewListItem>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    Ok(reviews)
}

/// 2. 新增评论（对应Python的add_stock_review）
/// 自动生成UUID，按类型存储
pub fn add_stock_review(app: &AppHandle, req: &AddReviewReq) -> Result<StockReview, StockError> {
    let conn = get_stock_review_db_conn(app)?;

    // 1. 参数校验（保留原有非空检查，新增日期格式合法性校验可选）
    if req.r#type.is_empty() {
        return Err(StockError::BusinessError(
            "评论类型（type）不能为空".to_string(),
        ));
    }
    if req.title.is_empty() {
        return Err(StockError::BusinessError(
            "评论标题（title）不能为空".to_string(),
        ));
    }
    if req.date.is_empty() {
        return Err(StockError::BusinessError(
            "日期（date）不能为空".to_string(),
        ));
    }

    // 2. 执行插入并获取自增ID（关键：用 RETURNING id 替代手动构造id）
    // 注意：SQL语句移除 id 字段，让数据库自动生成自增ID
    let mut stmt = conn
        .prepare(
            "INSERT INTO stock_review 
             (title, code, date, type, description)  -- 移除 id 字段
             VALUES (?1, ?2, ?3, ?4, ?5)
             RETURNING id",
        )
        .map_err(|e| StockError::DbError(e))?;

    // 3. 绑定参数并执行，获取自增ID（假设表中 id 是 INTEGER 类型自增）
    let auto_incr_id: i32 = stmt
        .query_row(
            params![
                &req.title,
                &req.code.to_uppercase(), // 股票代码统一大写
                &req.date,
                &req.r#type,
                &req.description, // 允许为空（若表结构允许）
            ],
            |row| row.get(0), // 提取返回的自增ID
        )
        .map_err(|e| StockError::DbError(e))?;

    // 4. 构造完整的 StockReview（用数据库生成的自增ID填充）
    let new_review = StockReview {
        id: auto_incr_id, // 若 id 是字符串类型，转成字符串；若本身是 i32，直接用 auto_incr_id
        title: req.title.clone(),
        code: req.code.to_uppercase(),
        date: req.date.clone(),
        r#type: req.r#type.clone(),
        description: req.description.clone(),
    };

    Ok(new_review)
}

/// 3. 获取单条评论（对应Python的get_single_stock_review）
/// 按类型+ID精准查询
pub fn get_single_stock_review(
    app: &AppHandle,
    req: &GetOrDeleteReviewReq,
) -> Result<Option<StockReview>, StockError> {
    let conn = get_stock_review_db_conn(app)?;

    // 执行精准查询（type + id 唯一确定一条记录）
    let mut stmt = conn
        .prepare(
            "SELECT id, title, code, date, type, description 
         FROM stock_review 
         WHERE id = ?1",
        )
        .map_err(|e| StockError::DbError(e))?;

    // optional()：无数据时返回None，有数据时返回Some(StockReview)
    let review = stmt
        .query_row(params![&req.id], |row| {
            Ok(StockReview {
                id: row.get(0)?,
                title: row.get(1)?,
                code: row.get(2)?,
                date: row.get(3)?,
                r#type: row.get(4)?,
                description: row.get(5)?,
            })
        })
        .optional()
        .map_err(|e| StockError::DbError(e))?;

    Ok(review)
}

/// 4. 删除评论（对应Python的delete_stock_review）
/// 按类型+ID精准删除
pub fn delete_stock_review(
    app: &AppHandle,
    req: &GetOrDeleteReviewReq,
) -> Result<bool, StockError> {
    let conn = get_stock_review_db_conn(app)?;

    // 执行删除
    let affected_rows = conn
        .execute(
            "DELETE FROM stock_review 
         WHERE id = ?1",
            params![&req.id],
        )
        .map_err(|e| StockError::DbError(e))?;

    // 影响行数>0表示删除成功
    Ok(affected_rows > 0)
}
