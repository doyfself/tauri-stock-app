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
pub fn add_or_edit_stock_review(
    app: &AppHandle,
    req: &AddReviewReq,
) -> Result<StockReview, StockError> {
    // 1. 获取数据库连接（复用你原有的 get_stock_review_db_conn 方法，不新增）
    let conn = get_stock_review_db_conn(app)?;

    // 2. 保留原有的参数校验逻辑（只加不减）
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

    // 3. 核心分支：根据 id 是否存在，判断新增/编辑
    let result_review = match req.id {
        // 3.1 有 ID → 执行编辑（UPDATE）
        Some(review_id) => {
            // 校验 ID 有效性（避免非法 ID）
            if review_id <= 0 {
                return Err(StockError::BusinessError(
                    "无效的评论ID，编辑失败".to_string(),
                ));
            }

            // 执行 UPDATE SQL（直接写 SQL 字符串，不依赖 schema）
            // 注意：SQL 语法根据数据库调整（SQLite/PostgreSQL 通用，MySQL 也类似）
            let update_sql = r#"
                UPDATE stock_review 
                SET title = ?1, code = ?2, date = ?3, type = ?4, description = ?5 
                WHERE id = ?6
            "#;

            // 执行更新（绑定参数：避免 SQL 注入，复用你原有的参数逻辑）
            let rows_affected = conn
                .execute(
                    update_sql,
                    (
                        &req.title,
                        &req.code.to_uppercase(), // 股票代码统一大写（保留原逻辑）
                        &req.date,
                        &req.r#type,
                        &req.description, // 允许为空（根据表结构调整）
                        review_id,        //  WHERE 条件：更新指定 ID 的记录
                    ),
                )
                .map_err(|e| StockError::DbError(e))?;

            // 检查是否有记录被更新（比如 ID 不存在时，rows_affected 为 0）
            if rows_affected == 0 {
                return Err(StockError::BusinessError(
                    format!("未找到 ID 为 {} 的评论，编辑失败", review_id).to_string(),
                ));
            }

            // 编辑成功：构造返回的 StockReview（用传入的 ID）
            StockReview {
                id: review_id,
                title: req.title.clone(),
                code: req.code.to_uppercase(),
                date: req.date.clone(),
                r#type: req.r#type.clone(),
                description: req.description.clone(),
            }
        }

        // 3.2 无 ID → 执行新增（INSERT，保留你原有的逻辑）
        None => {
            // 原有的 INSERT SQL（保留，仅调整参数绑定）
            let insert_sql = r#"
                INSERT INTO stock_review 
                (title, code, date, type, description) 
                VALUES (?1, ?2, ?3, ?4, ?5)
                RETURNING id; // 关键：获取数据库自动生成的自增 ID（SQLite 3.35+ 支持，PostgreSQL 也支持）
            "#;

            // 执行插入并获取自增 ID（复用原逻辑）
            let auto_incr_id: i32 = conn
                .query_row(
                    insert_sql,
                    (
                        &req.title,
                        &req.code.to_uppercase(),
                        &req.date,
                        &req.r#type,
                        &req.description,
                    ),
                    |row| row.get(0), // 提取返回的自增 ID
                )
                .map_err(|e| StockError::DbError(e))?;

            // 新增成功：构造返回的 StockReview（用自增 ID）
            StockReview {
                id: auto_incr_id,
                title: req.title.clone(),
                code: req.code.to_uppercase(),
                date: req.date.clone(),
                r#type: req.r#type.clone(),
                description: req.description.clone(),
            }
        }
    };

    // 4. 返回最终结果（新增/编辑后的 StockReview）
    Ok(result_review)
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
