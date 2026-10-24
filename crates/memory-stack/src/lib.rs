//! Bộ nhớ 3 tầng xếp chồng cho agent.
//!
//! - **Tầng 1 — sự kiện** ([`episode`]): ai, làm gì, lúc nào, trích ra từ từng cuộc trò chuyện. Chỉ ghi thêm.
//! - **Tầng 2 — nhận định** ([`belief`]): gộp âm thầm các sự kiện; tin mới mâu thuẫn thì tự sửa.
//! - **Tầng 3 — mô hình tư duy** ([`mental_model`]): câu trả lời cho những điều chủ nhân quan tâm.
//!
//! Agent luôn đọc từ đỉnh xuống đáy bằng [`MemoryStack::recall`].

pub mod belief;
pub mod episode;
pub mod mental_model;
pub mod recall;

use std::fs;
use std::path::Path;

use log::info;
use serde::{Deserialize, Serialize};

pub use belief::{Belief, BeliefChange, BeliefKey, BeliefLayer, Evidence, Revision};
pub use episode::{Claim, EXTRACTION_PROMPT, Episode, EpisodeDraft, EpisodeId, parse_extraction};
pub use mental_model::{AnswerLine, Concern, ConcernSpec, MentalModel};
pub use recall::{MIN_CONFIDENCE, Recall, RecallDepth};

/// Lỗi của bộ nhớ: đọc kết quả trích xuất hoặc đọc/ghi file.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, thiserror::Error)]
pub enum MemoryError {
    #[error("kết quả trích xuất không có mảng JSON")]
    NoJsonArray,
    #[error("JSON không hợp lệ: {0}")]
    Json(#[from] serde_json::Error),
    #[error("lỗi đọc/ghi file: {0}")]
    Io(#[from] std::io::Error),
}

/// Một cuộc trò chuyện vừa kết thúc: id và thời điểm (giây Unix).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, Copy)]
pub struct Conversation<'a> {
    pub id: &'a str,
    pub at: i64,
}

/// Ba tầng ký ức xếp chồng; ghi vào đáy, tầng trên tự cập nhật, đọc từ đỉnh.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct MemoryStack {
    next_id: EpisodeId,
    episodes: Vec<Episode>,
    beliefs: BeliefLayer,
    model: MentalModel,
}

impl MemoryStack {
    /// Bộ nhớ rỗng.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn new() -> Self {
        Self::default()
    }

    /// Ghi các sự kiện trích từ một cuộc trò chuyện vào tầng 1, rồi âm thầm gộp lên
    /// tầng 2 và làm mới tầng 3. Trả về các thay đổi ở tầng 2.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn record(
        &mut self,
        conversation: Conversation<'_>,
        drafts: Vec<EpisodeDraft>,
    ) -> Vec<BeliefChange> {
        let mut changes = Vec::new();
        for draft in drafts {
            let episode = self.append_episode(conversation, draft);
            changes.extend(self.beliefs.absorb(&episode));
            self.episodes.push(episode);
        }
        let touched: Vec<BeliefKey> = changes.iter().map(|change| change.key().clone()).collect();
        self.model.refresh(&touched, &self.beliefs, conversation.at);
        info!(
            "[MemoryStack] ghi cuộc trò chuyện {}: {} thay đổi nhận định",
            conversation.id,
            changes.len()
        );
        changes
    }

    /// Khai báo (hoặc sửa) một điều chủ nhân quan tâm; câu trả lời được dựng ngay.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn care_about(&mut self, spec: ConcernSpec, now: i64) {
        info!("[MemoryStack] quan tâm '{}'", spec.id);
        self.model.upsert(spec, &self.beliefs, now);
    }

    /// Đọc ký ức cho câu hỏi, từ đỉnh xuống đáy.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn recall(&self, query: &str) -> Recall<'_> {
        let layers = recall::Layers {
            model: &self.model,
            beliefs: &self.beliefs,
            episodes: &self.episodes,
        };
        recall::recall(&layers, query)
    }

    /// Tầng 1.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn episodes(&self) -> &[Episode] {
        &self.episodes
    }

    /// Tầng 2.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn beliefs(&self) -> &BeliefLayer {
        &self.beliefs
    }

    /// Tầng 3.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn model(&self) -> &MentalModel {
        &self.model
    }

    /// Lưu cả ba tầng ra file JSON (ghi file tạm rồi đổi tên để không hỏng file khi đang ghi).
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn save(&self, path: &Path) -> Result<(), MemoryError> {
        let temp = path.with_extension("tmp");
        fs::write(&temp, serde_json::to_vec_pretty(self)?)?;
        fs::rename(&temp, path)?;
        Ok(())
    }

    /// Nạp bộ nhớ từ file JSON; file chưa có thì trả bộ nhớ rỗng.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn load(path: &Path) -> Result<Self, MemoryError> {
        match fs::read(path) {
            Ok(bytes) => Ok(serde_json::from_slice(&bytes)?),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(Self::new()),
            Err(error) => Err(error.into()),
        }
    }

    /// Cấp id và chuẩn hoá một sự kiện mới.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    fn append_episode(&mut self, conversation: Conversation<'_>, draft: EpisodeDraft) -> Episode {
        self.next_id += 1;
        Episode {
            id: self.next_id,
            who: draft.who.trim().to_owned(),
            what: draft.what.trim().to_owned(),
            when: draft.when.unwrap_or(conversation.at),
            conversation_id: conversation.id.to_owned(),
            claim: draft
                .claim
                .map(|claim| Claim::new(&claim.subject, &claim.predicate, &claim.object)),
        }
    }
}
