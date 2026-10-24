---
name: theo-xu-huong-sau-nhip-hoi
kind: hypothesis
claim: Vào lệnh THEO xu huong MA sau nhịp hồi và nến xác nhận, SL ngoài râu nến (tối đa 15 giá), thoát khi MA gãy, khóa lãi
reject_if: PF < 1.2 trên out-of-sample
result: CHUA-KIEM-CHUNG
condition: chưa có số liệu trong sổ
evidence: không có
tested_by: [ea16, ea17, ea18, ea19]
updated: 2026-10-24
---
**Kết quả:** chưa có số liệu lưu lại. Changelog cho thấy đã chỉnh nhiều vòng (hold 96/192 nến, tắt CLIMAX/WICK vì cắt cụt lệnh chạy xa, khóa lãi 20→+10 rồi +3), dấu hiệu tối ưu trên cùng dữ liệu (nguy cơ overfit).
**Việc cần làm:** đánh giá lại một cách độc lập; `phan-bien` cần walk-forward.
