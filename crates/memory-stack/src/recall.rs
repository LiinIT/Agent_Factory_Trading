//! Đọc ký ức từ đỉnh xuống đáy: mô hình tư duy trước; chỉ khi đỉnh chưa trả lời chắc
//! mới xuống nhận định; nhận định vẫn chưa chắc mới lật tới sự kiện gốc.

use std::collections::BTreeSet;
use std::fmt::Write as _;

use crate::belief::{Belief, BeliefLayer};
use crate::episode::{Episode, EpisodeId, normalize};
use crate::mental_model::{Concern, MentalModel};

/// Độ tin cậy tối thiểu để dừng ở một tầng, không đọc xuống nữa.
pub const MIN_CONFIDENCE: f32 = 0.6;
const MIN_TERM_CHARS: usize = 2;
const MAX_EPISODES: usize = 20;

/// Tầng sâu nhất agent đã phải đọc tới.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RecallDepth {
    MentalModel,
    Beliefs,
    Episodes,
}

/// Kết quả đọc ký ức, xếp từ đỉnh xuống đáy.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug)]
pub struct Recall<'a> {
    pub depth: RecallDepth,
    pub concerns: Vec<&'a Concern>,
    pub beliefs: Vec<&'a Belief>,
    pub episodes: Vec<&'a Episode>,
}

/// Các tầng ký ức để đọc.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
pub(crate) struct Layers<'a> {
    pub model: &'a MentalModel,
    pub beliefs: &'a BeliefLayer,
    pub episodes: &'a [Episode],
}

/// Đọc từ đỉnh xuống đáy cho câu hỏi [query].
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
pub(crate) fn recall<'a>(layers: &Layers<'a>, query: &str) -> Recall<'a> {
    let terms = terms_of(query);
    let concerns: Vec<&Concern> = layers
        .model
        .concerns()
        .iter()
        .filter(|concern| matches_any(&terms, &[&concern.spec.question, &concern.spec.subject]))
        .collect();
    if !concerns.is_empty()
        && concerns
            .iter()
            .all(|concern| concern.confidence() >= MIN_CONFIDENCE)
    {
        return Recall {
            depth: RecallDepth::MentalModel,
            concerns,
            beliefs: Vec::new(),
            episodes: Vec::new(),
        };
    }
    let beliefs: Vec<&Belief> = layers
        .beliefs
        .iter()
        .filter(|belief| {
            concerns.iter().any(|concern| concern.covers(&belief.key))
                || matches_any(
                    &terms,
                    &[&belief.key.subject, &belief.key.predicate, &belief.value],
                )
        })
        .collect();
    if !beliefs.is_empty()
        && beliefs
            .iter()
            .all(|belief| belief.confidence() >= MIN_CONFIDENCE)
    {
        return Recall {
            depth: RecallDepth::Beliefs,
            concerns,
            beliefs,
            episodes: Vec::new(),
        };
    }
    let episodes = episodes_for(layers.episodes, &beliefs, &terms);
    Recall {
        depth: RecallDepth::Episodes,
        concerns,
        beliefs,
        episodes,
    }
}

/// Sự kiện gốc của các nhận định chưa chắc + sự kiện nhắc tới từ khoá, mới nhất trước.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn episodes_for<'a>(
    episodes: &'a [Episode],
    beliefs: &[&Belief],
    terms: &[String],
) -> Vec<&'a Episode> {
    let evidence: BTreeSet<EpisodeId> = beliefs
        .iter()
        .filter(|belief| belief.confidence() < MIN_CONFIDENCE)
        .flat_map(|belief| belief.evidence.iter().map(|item| item.episode))
        .collect();
    let mut found: Vec<&Episode> = episodes
        .iter()
        .filter(|episode| {
            evidence.contains(&episode.id) || matches_any(terms, &[&episode.who, &episode.what])
        })
        .collect();
    found.sort_by_key(|episode| std::cmp::Reverse(episode.when));
    found.truncate(MAX_EPISODES);
    found
}

/// Tách câu hỏi thành từ khoá đã chuẩn hoá (bỏ từ quá ngắn).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn terms_of(query: &str) -> Vec<String> {
    normalize(query)
        .split(' ')
        .filter(|term| term.chars().count() >= MIN_TERM_CHARS)
        .map(str::to_owned)
        .collect()
}

/// Có từ khoá nào nằm trong một trong các trường không.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn matches_any(terms: &[String], fields: &[&str]) -> bool {
    fields
        .iter()
        .map(|field| normalize(field))
        .any(|field| terms.iter().any(|term| field.contains(term.as_str())))
}

impl Recall<'_> {
    /// Viết kết quả thành đoạn ngữ cảnh cho agent, đúng thứ tự đỉnh → đáy.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn to_prompt(&self) -> String {
        let mut text = String::new();
        if !self.concerns.is_empty() {
            text.push_str("## Mô hình tư duy\n");
            for concern in &self.concerns {
                let _ = writeln!(
                    text,
                    "- {}: {}",
                    concern.spec.question,
                    concern.answer_text()
                );
            }
        }
        if !self.beliefs.is_empty() {
            text.push_str("## Nhận định\n");
            for belief in &self.beliefs {
                let _ = writeln!(
                    text,
                    "- {} {} {} (tin cậy {:.0}%, đã tự sửa {} lần)",
                    belief.key.subject,
                    belief.key.predicate,
                    belief.value,
                    belief.confidence() * 100.0,
                    belief.history.len()
                );
            }
        }
        if !self.episodes.is_empty() {
            text.push_str("## Sự kiện\n");
            for episode in &self.episodes {
                let _ = writeln!(
                    text,
                    "- [{}] {}: {} (cuộc trò chuyện {})",
                    episode.when, episode.who, episode.what, episode.conversation_id
                );
            }
        }
        text
    }
}
