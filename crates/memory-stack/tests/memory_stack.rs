use memory_stack::{
    BeliefChange, BeliefKey, Claim, ConcernSpec, Conversation, EpisodeDraft, MemoryStack,
    RecallDepth, parse_extraction,
};

const DAY: i64 = 86_400;
const START: i64 = 1_790_000_000;

/// Sự kiện nháp có khẳng định.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn said(who: &str, claim: (&str, &str, &str)) -> EpisodeDraft {
    EpisodeDraft {
        who: who.to_owned(),
        what: format!("{} {} {}", claim.0, claim.1, claim.2),
        when: None,
        claim: Some(Claim {
            subject: claim.0.to_owned(),
            predicate: claim.1.to_owned(),
            object: claim.2.to_owned(),
        }),
    }
}

/// Khoá nhận định đã chuẩn hoá.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn key(subject: &str, predicate: &str) -> BeliefKey {
    BeliefKey {
        subject: subject.to_owned(),
        predicate: predicate.to_owned(),
    }
}

/// Điều quan tâm về chỗ làm của Khánh.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn workplace_concern() -> ConcernSpec {
    ConcernSpec {
        id: "cho-lam".to_owned(),
        question: "Khánh đang làm ở đâu?".to_owned(),
        subject: "Khánh".to_owned(),
        predicates: vec!["làm việc tại".to_owned()],
    }
}

#[test]
fn tang_1_ghi_ai_lam_gi_luc_nao_tu_tung_cuoc_tro_chuyen() {
    let mut memory = MemoryStack::new();
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "MiaStudio"))],
    );
    let episode = &memory.episodes()[0];
    assert_eq!(
        (
            episode.who.as_str(),
            episode.when,
            episode.conversation_id.as_str()
        ),
        ("Khánh", START, "c1")
    );
    assert_eq!(
        episode.claim.as_ref().map(|claim| claim.subject.as_str()),
        Some("khánh")
    );
}

#[test]
fn tang_2_gop_su_kien_cung_gia_tri_thanh_mot_nhan_dinh() {
    let mut memory = MemoryStack::new();
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "thích ăn", "phở"))],
    );
    let changes = memory.record(
        Conversation {
            id: "c2",
            at: START + DAY,
        },
        vec![said("Khánh", ("khánh", "THÍCH ĂN", "Phở"))],
    );
    assert_eq!(
        changes,
        vec![BeliefChange::Reinforced(key("khánh", "thích ăn"))]
    );
    let belief = memory
        .beliefs()
        .get(&key("khánh", "thích ăn"))
        .expect("có nhận định");
    assert_eq!(
        (
            belief.value.as_str(),
            belief.evidence.len(),
            belief.confidence()
        ),
        ("phở", 2, 1.0)
    );
}

#[test]
fn tang_2_tin_moi_mau_thuan_thi_tu_sua_va_giu_lich_su() {
    let mut memory = MemoryStack::new();
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "công ty A"))],
    );
    let changes = memory.record(
        Conversation {
            id: "c2",
            at: START + DAY,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "MiaStudio"))],
    );
    assert_eq!(
        changes,
        vec![BeliefChange::Revised(key("khánh", "làm việc tại"))]
    );
    let belief = memory
        .beliefs()
        .get(&key("khánh", "làm việc tại"))
        .expect("có nhận định");
    assert_eq!(belief.value, "miastudio");
    assert_eq!(
        (
            belief.history[0].from.as_str(),
            belief.history[0].to.as_str()
        ),
        ("công ty a", "miastudio")
    );
    assert_eq!(belief.contradicting().count(), 1);
}

#[test]
fn tang_2_tin_cu_den_muon_khong_lat_nhan_dinh_moi() {
    let mut memory = MemoryStack::new();
    memory.record(
        Conversation {
            id: "c2",
            at: START + DAY,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "MiaStudio"))],
    );
    let changes = memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "công ty A"))],
    );
    assert_eq!(
        changes,
        vec![BeliefChange::Disputed(key("khánh", "làm việc tại"))]
    );
    let belief = memory
        .beliefs()
        .get(&key("khánh", "làm việc tại"))
        .expect("có nhận định");
    assert_eq!(
        (belief.value.as_str(), belief.confidence()),
        ("miastudio", 0.5)
    );
}

#[test]
fn tang_2_doi_qua_lai_a_b_a_van_tinh_dung_bang_chung() {
    let mut memory = MemoryStack::new();
    for (index, value) in ["A", "B", "A"].into_iter().enumerate() {
        memory.record(
            Conversation {
                id: "c",
                at: START + index as i64 * DAY,
            },
            vec![said("Khánh", ("Khánh", "dùng máy", value))],
        );
    }
    let belief = memory
        .beliefs()
        .get(&key("khánh", "dùng máy"))
        .expect("có nhận định");
    assert_eq!(
        (
            belief.value.as_str(),
            belief.supporting().count(),
            belief.contradicting().count()
        ),
        ("a", 2, 1)
    );
    assert_eq!(belief.history.len(), 2);
}

#[test]
fn tang_3_tu_lam_moi_khi_nhan_dinh_bi_sua() {
    let mut memory = MemoryStack::new();
    memory.care_about(workplace_concern(), START);
    assert_eq!(
        memory.model().concerns()[0].answer_text(),
        "chưa đủ dữ kiện"
    );
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "công ty A"))],
    );
    memory.record(
        Conversation {
            id: "c2",
            at: START + DAY,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "MiaStudio"))],
    );
    let concern = &memory.model().concerns()[0];
    assert!(concern.answer_text().contains("miastudio"));
    assert_eq!(concern.refreshed_at, START + DAY);
}

#[test]
fn doc_tu_dinh_dung_o_mo_hinh_tu_duy_khi_da_chac() {
    let mut memory = MemoryStack::new();
    memory.care_about(workplace_concern(), START);
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "MiaStudio"))],
    );
    let recall = memory.recall("Khánh làm ở đâu");
    assert_eq!(recall.depth, RecallDepth::MentalModel);
    assert!(recall.beliefs.is_empty() && recall.episodes.is_empty());
    assert!(recall.to_prompt().starts_with("## Mô hình tư duy"));
}

#[test]
fn doc_xuong_su_kien_khi_nhan_dinh_con_tranh_cai() {
    let mut memory = MemoryStack::new();
    memory.care_about(workplace_concern(), START);
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "công ty A"))],
    );
    memory.record(
        Conversation {
            id: "c2",
            at: START + DAY,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "MiaStudio"))],
    );
    let recall = memory.recall("Khánh làm ở đâu");
    assert_eq!(recall.depth, RecallDepth::Episodes);
    assert_eq!(recall.concerns.len(), 1);
    assert_eq!(recall.beliefs.len(), 1);
    assert_eq!(
        recall
            .episodes
            .iter()
            .map(|episode| episode.conversation_id.as_str())
            .collect::<Vec<_>>(),
        vec!["c2", "c1"]
    );
}

#[test]
fn doc_nhan_dinh_khi_khong_co_dieu_quan_tam_khop() {
    let mut memory = MemoryStack::new();
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "thích ăn", "phở"))],
    );
    let recall = memory.recall("món phở");
    assert_eq!(recall.depth, RecallDepth::Beliefs);
    assert_eq!(recall.beliefs[0].value, "phở");
}

#[test]
fn doc_ket_qua_trich_xuat_cua_model() {
    let raw = "Đây là kết quả:\n```json\n[{\"who\":\"Khánh\",\"what\":\"nói đã chuyển sang MiaStudio\",\"claim\":{\"subject\":\"khánh\",\"predicate\":\"làm việc tại\",\"object\":\"miastudio\"}},{\"who\":\"\",\"what\":\"bỏ\"}]\n```";
    let drafts = parse_extraction(raw).expect("đọc được");
    assert_eq!(drafts.len(), 1);
    assert!(parse_extraction("không có json").is_err());
}

#[test]
fn luu_va_nap_lai_du_ca_ba_tang() {
    let path = std::env::temp_dir().join(format!("memory-stack-test-{}.json", std::process::id()));
    let mut memory = MemoryStack::new();
    memory.care_about(workplace_concern(), START);
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        vec![said("Khánh", ("Khánh", "làm việc tại", "MiaStudio"))],
    );
    memory.save(&path).expect("lưu được");
    let loaded = MemoryStack::load(&path).expect("nạp được");
    std::fs::remove_file(&path).ok();
    assert_eq!(loaded.episodes(), memory.episodes());
    assert_eq!(loaded.model().concerns(), memory.model().concerns());
    assert!(
        MemoryStack::load(&path)
            .expect("file chưa có")
            .episodes()
            .is_empty()
    );
}
