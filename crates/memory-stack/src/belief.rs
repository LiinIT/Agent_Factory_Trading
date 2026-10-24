//! Tầng 2 — nhận định: gộp âm thầm các sự kiện cùng `chủ thể · thuộc tính` thành một
//! nhận định có độ tin cậy. Thông tin mới mâu thuẫn thì tự sửa và giữ lại lịch sử sửa.

use std::collections::BTreeMap;

use log::{debug, info};
use serde::{Deserialize, Serialize};

use crate::episode::{Claim, Episode, EpisodeId};

/// Khoá của nhận định: một thuộc tính của một chủ thể.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct BeliefKey {
    pub subject: String,
    pub predicate: String,
}

/// Một lần nhận định bị sửa: từ giá trị cũ sang mới, do sự kiện nào gây ra.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Revision {
    pub from: String,
    pub to: String,
    pub at: i64,
    pub caused_by: EpisodeId,
}

/// Một sự kiện ở tầng 1 và giá trị nó khẳng định.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Evidence {
    pub episode: EpisodeId,
    pub value: String,
}

/// Nhận định hiện tại về một thuộc tính, kèm mọi bằng chứng ở tầng 1 và lịch sử tự sửa.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Belief {
    pub key: BeliefKey,
    pub value: String,
    pub evidence: Vec<Evidence>,
    pub updated_at: i64,
    pub history: Vec<Revision>,
}

/// Việc một sự kiện đã làm với tầng 2.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BeliefChange {
    Created(BeliefKey),
    Reinforced(BeliefKey),
    Revised(BeliefKey),
    Disputed(BeliefKey),
}

impl BeliefChange {
    /// Khoá nhận định bị tác động.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn key(&self) -> &BeliefKey {
        match self {
            Self::Created(key)
            | Self::Reinforced(key)
            | Self::Revised(key)
            | Self::Disputed(key) => key,
        }
    }
}

impl Belief {
    /// Tỉ lệ bằng chứng ủng hộ giá trị hiện tại trên tổng bằng chứng (0..=1).
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn confidence(&self) -> f32 {
        if self.evidence.is_empty() {
            return 0.0;
        }
        self.supporting().count() as f32 / self.evidence.len() as f32
    }

    /// Các sự kiện khẳng định đúng giá trị hiện tại.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn supporting(&self) -> impl Iterator<Item = EpisodeId> + '_ {
        self.evidence
            .iter()
            .filter(|item| item.value == self.value)
            .map(|item| item.episode)
    }

    /// Các sự kiện khẳng định giá trị khác giá trị hiện tại.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn contradicting(&self) -> impl Iterator<Item = EpisodeId> + '_ {
        self.evidence
            .iter()
            .filter(|item| item.value != self.value)
            .map(|item| item.episode)
    }
}

impl BeliefKey {
    /// Khoá của một khẳng định.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn of(claim: &Claim) -> Self {
        Self {
            subject: claim.subject.clone(),
            predicate: claim.predicate.clone(),
        }
    }
}

/// Tầng 2: bảng nhận định theo khoá.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct BeliefLayer {
    beliefs: BTreeMap<String, Belief>,
}

impl BeliefLayer {
    /// Gộp một sự kiện vào nhận định của nó. Cùng giá trị → củng cố; khác giá trị và
    /// không cũ hơn → tự sửa nhận định theo tin mới; khác giá trị nhưng cũ hơn (tin đến
    /// muộn) → chỉ ghi thành bằng chứng phản bác, không lật nhận định.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn absorb(&mut self, episode: &Episode) -> Option<BeliefChange> {
        let claim = episode.claim.as_ref()?;
        let key = BeliefKey::of(claim);
        let Some(belief) = self.beliefs.get_mut(&storage_key(&key)) else {
            debug!(
                "[BeliefLayer] tạo nhận định {}·{} = {}",
                key.subject, key.predicate, claim.object
            );
            self.beliefs.insert(
                storage_key(&key),
                new_belief(key.clone(), episode, &claim.object),
            );
            return Some(BeliefChange::Created(key));
        };
        belief.evidence.push(Evidence {
            episode: episode.id,
            value: claim.object.clone(),
        });
        if belief.value == claim.object {
            belief.updated_at = belief.updated_at.max(episode.when);
            return Some(BeliefChange::Reinforced(key));
        }
        if episode.when < belief.updated_at {
            debug!(
                "[BeliefLayer] tin cũ mâu thuẫn {}·{}: giữ {}",
                key.subject, key.predicate, belief.value
            );
            return Some(BeliefChange::Disputed(key));
        }
        info!(
            "[BeliefLayer] tự sửa {}·{}: {} → {}",
            key.subject, key.predicate, belief.value, claim.object
        );
        revise(belief, episode, &claim.object);
        Some(BeliefChange::Revised(key))
    }

    /// Nhận định theo khoá.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn get(&self, key: &BeliefKey) -> Option<&Belief> {
        self.beliefs.get(&storage_key(key))
    }

    /// Mọi nhận định, xếp theo chủ thể rồi thuộc tính.
    /// Author: HoNgocKhanh
    /// Company: MiaStudio
    /// Time: 2026-10-17
    pub fn iter(&self) -> impl Iterator<Item = &Belief> {
        self.beliefs.values()
    }
}

/// Khoá chuỗi để lưu trong map (JSON chỉ cho khoá dạng chuỗi).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn storage_key(key: &BeliefKey) -> String {
    format!("{}\u{1f}{}", key.subject, key.predicate)
}

/// Nhận định mới từ sự kiện đầu tiên nói về khoá này.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn new_belief(key: BeliefKey, episode: &Episode, value: &str) -> Belief {
    Belief {
        key,
        value: value.to_owned(),
        evidence: vec![Evidence {
            episode: episode.id,
            value: value.to_owned(),
        }],
        updated_at: episode.when,
        history: Vec::new(),
    }
}

/// Lật nhận định sang giá trị mới (bằng chứng đã được ghi trước đó) và lưu lịch sử sửa.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn revise(belief: &mut Belief, episode: &Episode, value: &str) {
    belief.history.push(Revision {
        from: belief.value.clone(),
        to: value.to_owned(),
        at: episode.when,
        caused_by: episode.id,
    });
    belief.value = value.to_owned();
    belief.updated_at = episode.when;
}
