//! Chạy thử: `cargo run --example demo`

use memory_stack::{ConcernSpec, Conversation, MemoryStack, parse_extraction};

const DAY: i64 = 86_400;
const START: i64 = 1_790_000_000;

/// Hai cuộc trò chuyện mâu thuẫn nhau, rồi agent đọc ký ức từ đỉnh xuống.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
fn main() -> Result<(), memory_stack::MemoryError> {
    let mut memory = MemoryStack::new();
    memory.care_about(
        ConcernSpec {
            id: "cho-lam".to_owned(),
            question: "Khánh đang làm ở đâu?".to_owned(),
            subject: "khánh".to_owned(),
            predicates: vec!["làm việc tại".to_owned()],
        },
        START,
    );

    let first = r#"[{"who":"Khánh","what":"kể đang làm ở công ty A","claim":{"subject":"khánh","predicate":"làm việc tại","object":"công ty A"}}]"#;
    memory.record(
        Conversation {
            id: "c1",
            at: START,
        },
        parse_extraction(first)?,
    );
    println!(
        "Sau cuộc 1:\n{}",
        memory.recall("Khánh làm ở đâu").to_prompt()
    );

    let second = r#"[{"who":"Khánh","what":"báo đã chuyển sang MiaStudio","claim":{"subject":"khánh","predicate":"làm việc tại","object":"MiaStudio"}}]"#;
    memory.record(
        Conversation {
            id: "c2",
            at: START + DAY,
        },
        parse_extraction(second)?,
    );
    let recall = memory.recall("Khánh làm ở đâu");
    println!(
        "Sau cuộc 2 (đọc tới tầng {:?}):\n{}",
        recall.depth,
        recall.to_prompt()
    );
    Ok(())
}
