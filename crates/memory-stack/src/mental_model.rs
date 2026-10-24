//! Tầng 3 (đỉnh) — mô hình tư duy: câu trả lời dựng sẵn cho những điều chủ nhân quan
//! tâm, tổng hợp từ nhận định tầng 2 và tự làm mới mỗi khi nhận định liên quan đổi.

use log::debug;
use serde::{Deserialize, Serialize};

use crate::belief::{BeliefKey, BeliefLayer};
use crate::episode::normalize;

/// Khai báo một điều cần quan tâm: câu hỏi, về chủ thể nào, những thuộc tính nào
/// (để trống = mọi thuộc tính của chủ thể).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ConcernSpec {
    pub id: String,
    pub question: String,
    pub subject: String,
    pub predicates: Vec<String>,
}

/// Một dòng của câu trả lời, trỏ về nhận định gốc ở tầng 2.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AnswerLine {
    pub key: BeliefKey,
    pub value: String,
    pub confidence: f32,
}

/// Một điều quan tâm cùng câu trả lời hiện tại.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Concern {
    pub spec: ConcernSpec,
    pub answer: Vec<AnswerLine>,
    pub refreshed_at: i64,
}

impl Concern {
    /// Độ tin cậy của câu trả lời = dòng kém chắc nhất; chưa có dòng nào thì 0.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn confidence(&self) -> f32 {
        self.answer
            .iter()
            .map(|line| line.confidence)
            .reduce(f32::min)
            .unwrap_or(0.0)
    }

    /// Nhận định [key] có thuộc phạm vi điều quan tâm này không.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn covers(&self, key: &BeliefKey) -> bool {
        key.subject == self.spec.subject
            && (self.spec.predicates.is_empty() || self.spec.predicates.contains(&key.predicate))
    }

    /// Câu trả lời dạng chữ, mỗi thuộc tính một dòng kèm độ tin cậy.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn answer_text(&self) -> String {
        if self.answer.is_empty() {
            return "chưa đủ dữ kiện".to_owned();
        }
        self.answer
            .iter()
            .map(|line| {
                format!(
                    "{} {} {} (tin cậy {:.0}%)",
                    line.key.subject,
                    line.key.predicate,
                    line.value,
                    line.confidence * 100.0
                )
            })
            .collect::<Vec<_>>()
            .join("; ")
    }

    /// Dựng lại câu trả lời từ các nhận định trong phạm vi.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    fn rebuild(&mut self, beliefs: &BeliefLayer, now: i64) {
        self.answer = beliefs
            .iter()
            .filter(|belief| self.covers(&belief.key))
            .map(|belief| AnswerLine {
                key: belief.key.clone(),
                value: belief.value.clone(),
                confidence: belief.confidence(),
            })
            .collect();
        self.refreshed_at = now;
    }
}

/// Tầng 3: danh sách điều quan tâm.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct MentalModel {
    concerns: Vec<Concern>,
}

impl MentalModel {
    /// Thêm hoặc thay một điều quan tâm (theo id) và dựng câu trả lời ngay.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn upsert(&mut self, spec: ConcernSpec, beliefs: &BeliefLayer, now: i64) {
        let spec = ConcernSpec {
            subject: normalize(&spec.subject),
            predicates: spec
                .predicates
                .iter()
                .map(|predicate| normalize(predicate))
                .collect(),
            ..spec
        };
        let mut concern = Concern {
            spec,
            answer: Vec::new(),
            refreshed_at: now,
        };
        concern.rebuild(beliefs, now);
        match self
            .concerns
            .iter_mut()
            .find(|item| item.spec.id == concern.spec.id)
        {
            Some(existing) => *existing = concern,
            None => self.concerns.push(concern),
        }
    }

    /// Làm mới âm thầm mọi điều quan tâm chạm tới các nhận định vừa đổi.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn refresh(&mut self, touched: &[BeliefKey], beliefs: &BeliefLayer, now: i64) {
        for concern in self
            .concerns
            .iter_mut()
            .filter(|concern| touched.iter().any(|key| concern.covers(key)))
        {
            debug!("[MentalModel] làm mới '{}'", concern.spec.id);
            concern.rebuild(beliefs, now);
        }
    }

    /// Mọi điều quan tâm.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn concerns(&self) -> &[Concern] {
        &self.concerns
    }
}
