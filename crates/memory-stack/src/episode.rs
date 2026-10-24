//! Tầng 1 — ký ức sự kiện: ai, làm gì, lúc nào, trích ra từ từng cuộc trò chuyện.
//! Tầng này chỉ ghi thêm, không bao giờ sửa: nó là bằng chứng gốc cho hai tầng trên.

use serde::{Deserialize, Serialize};

use crate::MemoryError;

pub type EpisodeId = u64;

/// Một khẳng định có cấu trúc rút từ sự kiện: `chủ thể · thuộc tính = giá trị`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Claim {
    pub subject: String,
    pub predicate: String,
    pub object: String,
}

/// Một sự kiện đã ghi vào tầng 1, kèm cuộc trò chuyện nguồn.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Episode {
    pub id: EpisodeId,
    pub who: String,
    pub what: String,
    pub when: i64,
    pub conversation_id: String,
    pub claim: Option<Claim>,
}

/// Sự kiện vừa trích ra, chưa có id; `when` trống thì lấy thời điểm của cuộc trò chuyện.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EpisodeDraft {
    pub who: String,
    pub what: String,
    #[serde(default)]
    pub when: Option<i64>,
    #[serde(default)]
    pub claim: Option<Claim>,
}

/// Prompt gửi cho model để trích sự kiện từ một cuộc trò chuyện; kết quả đọc bằng [`parse_extraction`].
pub const EXTRACTION_PROMPT: &str = r#"Đọc cuộc trò chuyện dưới đây và liệt kê các sự kiện đáng nhớ.
Mỗi sự kiện: ai (who), làm gì / nói gì (what), và nếu sự kiện khẳng định một sự thật
về ai/cái gì thì thêm claim {subject, predicate, object} — viết ngắn, chữ thường,
cùng một thuộc tính luôn dùng cùng một cách gọi (vd "thích ăn", "làm việc tại").
Chỉ trả về JSON: [{"who": "...", "what": "...", "claim": {"subject": "...", "predicate": "...", "object": "..."}}]"#;

/// Đọc JSON model trả về theo [`EXTRACTION_PROMPT`] (chấp nhận cả khối ```json bao quanh).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
pub fn parse_extraction(raw: &str) -> Result<Vec<EpisodeDraft>, MemoryError> {
    let start = raw.find('[').ok_or(MemoryError::NoJsonArray)?;
    let end = raw.rfind(']').ok_or(MemoryError::NoJsonArray)?;
    let drafts: Vec<EpisodeDraft> = serde_json::from_str(&raw[start..=end])?;
    Ok(drafts
        .into_iter()
        .filter(|draft| !draft.who.trim().is_empty() && !draft.what.trim().is_empty())
        .collect())
}

/// Chuẩn hoá chữ để so khớp: chữ thường, gộp khoảng trắng.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
pub(crate) fn normalize(text: &str) -> String {
    text.split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}

impl Claim {
    /// Tạo khẳng định đã chuẩn hoá chữ.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn new(subject: &str, predicate: &str, object: &str) -> Self {
        Self {
            subject: normalize(subject),
            predicate: normalize(predicate),
            object: normalize(object),
        }
    }
}
