Checklist Figma và bàn giao giao diện PerfumeStore

Figma file: <FIGMA_FILE_URL>

Jira board: <JIRA_BOARD_URL>

Repository: <GITHUB_REPOSITORY_URL>

1. Cấu trúc file Figma

Tạo một file dùng chung gồm các page:

00 Cover & Links

01 Research & User Flow

02 Wireframes

03 Design System

04 Customer Desktop

05 Customer Mobile

06 Admin Dashboard

07 Prototype

08 Handoff

Page 00 Cover & Links cần có link Jira, GitHub, website demo và thông tin phiên bản.

2. Frame tối thiểu

Khách hàng

Trang chủ.

Danh sách/tìm kiếm/lọc sản phẩm.

Chi tiết sản phẩm và chọn dung tích.

Giỏ hàng.

Checkout COD/QR.

Đăng ký và đăng nhập.

Hồ sơ.

Lịch sử và chi tiết đơn hàng.

Quản trị

Admin login.

Dashboard.

Danh sách/thêm/sửa sản phẩm.

Quản lý thương hiệu.

Quản lý danh mục.

Quản lý đơn hàng và trạng thái.

Danh sách người dùng.

Báo cáo và cảnh báo tồn kho.

Responsive

Mobile cho luồng mua hàng chính.

Trạng thái menu mobile.

Form, bảng và modal ở kích thước nhỏ.

3. Design system

Tạo styles/tokens cho:

Màu: primary, surface, text, success, warning, danger.

Typography: display, heading, body, caption.

Spacing, radius và shadow.

Grid/breakpoint.

Components cần có variants:

Button.

Input/select/textarea.

Product card.

Badge trạng thái.

Navbar/sidebar.

Modal.

Table và pagination.

Toast/alert.

Empty/loading/error state.

Mỗi component nên có trạng thái default, hover, disabled, loading và error khi phù hợp.

4. Prototype cần demo

Khách hàng:

Home → Product list → Product detail → Add to cart → Checkout → Login → Place order → Order history

Quản trị:

Admin login → Dashboard → Add/edit product → Update order status → View report

5. Quy tắc đặt tên

Frame:

PERF-<id> / <Screen> / <Desktop|Mobile> / <State>

Ví dụ:

PERF-21 / Checkout / Desktop / Default
PERF-21 / Checkout / Mobile / Validation Error

Component:

Component/Variant/State

6. Liên kết với Jira và GitHub

Dán link frame/prototype vào ticket UI.

PR frontend ghi link Figma tương ứng.

Jira ticket ghi link PR và ảnh before/after.

README và docs/README.md chỉ ghi link Figma thật sau khi quyền truy cập đã được kiểm tra.

7. Handoff cho lập trình

Mỗi màn hình cần thể hiện:

Kích thước frame và breakpoint.

Khoảng cách, font, màu và component dùng lại.

Trạng thái loading, empty, success và error.

Nội dung validation.

Quyền user/admin nếu liên quan.

API endpoint hoặc dữ liệu cần hiển thị.

8. Checklist trước khi bàn giao

Không có frame trùng tên hoặc chưa sắp xếp.

Component dùng Auto Layout khi phù hợp.

Màu và font dùng styles/tokens.

Prototype không có link hỏng.

Có mobile flow.

Có trạng thái lỗi và dữ liệu rỗng.

Jira ticket có link đúng frame.

Người implement đã review Figma.

Ảnh giao diện thực tế được đối chiếu với thiết kế.