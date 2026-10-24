# Hướng dẫn xử lý React hydration — Agent Factory web

## Nguyên tắc

Markup render trên server và lần render đầu ở trình duyệt phải giống nhau. Không đọc `Date.now()`, `Math.random()`, `window`, `localStorage`, locale hoặc timezone mặc định để quyết định text/attributes trong render đầu. Nếu cần dữ liệu chỉ có ở browser, khởi tạo cùng một giá trị ổn định rồi cập nhật trong `useEffect`, hoặc truyền snapshot từ server.

## Khi có cảnh báo hydration

1. Lấy component stack và phần tử/attribute bị lệch từ console hoặc React DevTools.
2. Tái hiện bằng tải lại cứng và profile trình duyệt sạch để loại trừ extension sửa DOM.
3. Tìm nhánh server/client, thời gian/ngẫu nhiên, locale/timezone, dữ liệu async và nesting HTML không hợp lệ.
4. Chỉ sửa nguồn đã xác định; không dùng `suppressHydrationWarning` để che lỗi rộng.
5. Xác minh lại trong browser có console access; typecheck/build riêng lẻ không chứng minh đã hết hydration warning.

## Ghi nhận 2026-10-17

Người dùng báo cảnh báo React: “A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.” Trong `apps/web/lib/use-now.ts`, hook trước đây khởi tạo state bằng `Date.now()` ngay trong render. Đã đổi sang giá trị khởi tạo ổn định `0`, rồi cập nhật thời gian thật trong `useEffect`.

Giới hạn bằng chứng: các component dùng `useNow()` chỉ render sau khi `useFactory()` nhận state từ API; server render ban đầu của trang có `state === null`. Vì vậy đoạn `Date.now()` là rủi ro hydration thật nhưng chưa được xác nhận là nguyên nhân của cảnh báo cụ thể này. Không có Chrome DevTools connector hoặc browser surface khả dụng trong phiên để lấy component stack/console. Nếu cảnh báo còn xuất hiện, kiểm tra stack và thử profile không extension; extension trình duyệt cũng có thể sửa attributes trước hydration.

Xác minh đã chạy: TypeScript `tsc --noEmit --incremental false -p apps/web/tsconfig.json` thành công. Chưa xác minh trực tiếp cảnh báo đã biến mất trong browser.

## Ghi nhận 2026-10-17 (lần 2) — đã xác định nguồn: extension ColorZilla

Cảnh báo cùng câu chữ quay lại, lần này có component stack. Phần lệch duy nhất là thuộc tính `cz-shortcut-listen="true"` trên `<body>` trong `RootLayout` (`apps/web/app/layout.tsx`). Thuộc tính này do extension **ColorZilla** chèn vào DOM trước khi React hydrate — không do code của app.

Đã sửa: thêm `suppressHydrationWarning` vào **riêng thẻ `<body>`**. Đây là ngoại lệ hợp lệ của nguyên tắc 4 ở trên vì nguồn đã được xác định là extension, và prop này chỉ bỏ qua lệch thuộc tính/text của chính thẻ `<body>`, không lan xuống component con — lỗi hydration thật trong app vẫn hiện.

Lưu ý khi gặp lại:
- Không thêm `suppressHydrationWarning` vào `<html>` hay component khác nếu chưa xác định được nguồn bằng component stack.
- Các extension khác (Grammarly: `data-gr-*`, LastPass, dịch trang…) có thể chèn thuộc tính tương tự lên `<html>`/`<body>`; extension sửa DOM *bên trong* body thì prop này không che được — thử profile Chrome sạch.

Xác minh: typecheck web đạt. Chưa tải lại trang trong trình duyệt có ColorZilla để xác nhận cảnh báo đã hết.
