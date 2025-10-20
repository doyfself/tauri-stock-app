use crate::db::common::init_database;
use crate::structs::self_reflect_structs::{
    AddReflectReq, GetOrDeleteReflectReq, ReflectItem, ReflectListItem,
};
use crate::structs::StockError;
use rusqlite::{params, Connection, OptionalExtension};
use tauri::AppHandle;

/// 获取 self_reflect 数据库连接（沿用项目风格）
pub fn get_self_reflect_db_conn(app: &AppHandle) -> Result<Connection, StockError> {
    init_database(app, "self_reflect")
        .map_err(|e| StockError::BusinessError(format!("获取股票评论数据库连接失败: {}", e)))
}

/// 1. 获取反省列表（对应Python的get_self_reflect）
pub fn get_self_reflect_list(app: &AppHandle) -> Result<Vec<ReflectListItem>, StockError> {
    let conn = get_self_reflect_db_conn(app)?;

    // 构造SQL：按类型筛选 + 标题模糊搜索（不区分大小写）
    let mut stmt = conn
        .prepare(
            "SELECT id, title
         FROM self_reflect 
         ORDER BY date DESC", // 按日期倒序，最新评论在前
        )
        .map_err(|e| StockError::DbError(e))?;

    // 执行查询并映射为StockReview列表
    let reviews = stmt
        .query_map([], |row| {
            Ok(ReflectListItem {
                id: row.get(0)?,
                title: row.get(1)?,
            })
        })
        .map_err(|e| StockError::DbError(e))?
        .collect::<Result<Vec<ReflectListItem>, _>>()
        .map_err(|e| StockError::DbError(e))?;

    Ok(reviews)
}

/// 2. 新增评论（对应Python的add_self_reflect）
pub fn add_or_edit_self_reflect(
    app: &AppHandle,
    req: &AddReflectReq,
) -> Result<ReflectItem, StockError> {
    // 1. 获取数据库连接（复用你原有的 get_self_reflect_db_conn 方法，不新增）
    let conn = get_self_reflect_db_conn(app)?;
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
                UPDATE self_reflect 
                SET title = ?1, code = ?2, date = ?3, description = ?4
                WHERE id = ?5
            "#;

            // 执行更新（绑定参数：避免 SQL 注入，复用你原有的参数逻辑）
            let rows_affected = conn
                .execute(
                    update_sql,
                    (
                        &req.title,
                        &req.code.to_uppercase(), // 股票代码统一大写（保留原逻辑）
                        &req.date,
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
            ReflectItem {
                id: review_id,
                title: req.title.clone(),
                code: req.code.to_uppercase(),
                date: req.date.clone(),
                description: req.description.clone(),
            }
        }

        // 3.2 无 ID → 执行新增（INSERT，保留你原有的逻辑）
        None => {
            // 原有的 INSERT SQL（保留，仅调整参数绑定）
            let insert_sql = r#"
                INSERT INTO self_reflect 
                (title, code, date, description) 
                VALUES (?1, ?2, ?3, ?4)
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
                        &req.description,
                    ),
                    |row| row.get(0), // 提取返回的自增 ID
                )
                .map_err(|e| StockError::DbError(e))?;

            // 新增成功：构造返回的 StockReview（用自增 ID）
            ReflectItem {
                id: auto_incr_id,
                title: req.title.clone(),
                code: req.code.to_uppercase(),
                date: req.date.clone(),
                description: req.description.clone(),
            }
        }
    };

    // 4. 返回最终结果（新增/编辑后的 StockReview）
    Ok(result_review)
}

/// 3. 获取单条评论（对应Python的get_single_self_reflect）
/// 按类型+ID精准查询
pub fn get_single_self_reflect(
    app: &AppHandle,
    req: &GetOrDeleteReflectReq,
) -> Result<Option<ReflectItem>, StockError> {
    let conn = get_self_reflect_db_conn(app)?;

    // 执行精准查询（type + id 唯一确定一条记录）
    let mut stmt = conn
        .prepare(
            "SELECT id, title, code, date, description 
         FROM self_reflect 
         WHERE id = ?1",
        )
        .map_err(|e| StockError::DbError(e))?;

    // optional()：无数据时返回None，有数据时返回Some(StockReview)
    let review = stmt
        .query_row(params![&req.id], |row| {
            Ok(ReflectItem {
                id: row.get(0)?,
                title: row.get(1)?,
                code: row.get(2)?,
                date: row.get(3)?,
                description: row.get(4)?,
            })
        })
        .optional()
        .map_err(|e| StockError::DbError(e))?;

    Ok(review)
}

/// 4. 删除评论（对应Python的delete_self_reflect）
/// 按类型+ID精准删除
pub fn delete_self_reflect(
    app: &AppHandle,
    req: &GetOrDeleteReflectReq,
) -> Result<bool, StockError> {
    let conn = get_self_reflect_db_conn(app)?;

    // 执行删除
    let affected_rows = conn
        .execute(
            "DELETE FROM self_reflect 
         WHERE id = ?1",
            params![&req.id],
        )
        .map_err(|e| StockError::DbError(e))?;

    // 影响行数>0表示删除成功
    Ok(affected_rows > 0)
}
