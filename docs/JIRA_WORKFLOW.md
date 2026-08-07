Quy trình Jira cho dự án PerfumeStore

Jira board: <JIRA_BOARD_URL>

Project key dự kiến: PERF

Repository: <GITHUB_REPOSITORY_URL>

1. Board

Dùng Scrum board với các cột:

Backlog → Selected for Development → In Progress → Code Review → Testing → Done

Không chuyển ticket thẳng từ Backlog sang Done.

2. Loại issue

Epic: nhóm chức năng lớn, ví dụ Customer, Admin, Security, DevOps.

Story: chức năng mang giá trị cho người dùng.

Task: công việc kỹ thuật hoặc tài liệu.

Bug: lỗi có bước tái hiện và kết quả mong đợi.

3. Mẫu ticket

## Mục tiêu
Mô tả ngắn chức năng hoặc vấn đề cần giải quyết.

## Phạm vi
- File/module liên quan
- Không bao gồm

## Acceptance criteria
- [ ] Điều kiện 1 kiểm thử được
- [ ] Điều kiện 2 kiểm thử được
- [ ] Có thông báo lỗi phù hợp

## Minh chứng
- Branch:
- Commit:
- Pull Request:
- Test/ảnh/video:
- Figma/Swagger:

4. Definition of Ready

Ticket chỉ được kéo vào sprint khi có:

Mục tiêu hoặc user story rõ.

Acceptance criteria kiểm thử được.

Người phụ trách thật.

Story point/ước lượng.

Link Figma hoặc API nếu liên quan.

Phụ thuộc đã được nhận diện.

5. Definition of Done

Code/tài liệu đã push bằng tài khoản thành viên phụ trách.

Có Pull Request.

Có ít nhất một review của thành viên khác.

CI pass.

Test hoặc manual evidence đã đính kèm.

Swagger được cập nhật nếu API thay đổi.

Tài liệu được cập nhật nếu kiến trúc/triển khai thay đổi.

Chức năng chạy được bằng Docker Compose nếu liên quan.

Ticket có link branch, commit và PR.

6. Quy tắc branch và commit

Branch:

feature/PERF-<id>-ten-ngan
fix/PERF-<id>-ten-ngan
docs/PERF-<id>-ten-ngan

Commit:

PERF-<id> <type>(<scope>): <mô tả>

Ví dụ:

PERF-20 docs(architecture): update API and Docker diagrams
PERF-21 test(openapi): verify required operations
PERF-22 fix(order): restore stock when owner cancels order

7. Luồng một ticket

Nhận ticket và chuyển sang In Progress.

Tạo branch từ develop hoặc nhánh nhóm đang thống nhất.

Sửa và kiểm thử.

Push branch, mở PR.

Chuyển ticket sang Code Review.

Người khác review; tác giả sửa phản hồi.

CI pass, chuyển sang Testing.

Kiểm tra acceptance criteria.

Merge và chuyển Done.

8. Sprint gợi ý

Sprint 1 — Phân tích và thiết kế

Requirement, use case và ERD.

Wireframe, design system Figma.

Backlog, phân công và quy tắc repository.

Sprint 2 — Core customer/backend

Auth/JWT.

Product catalog.

Cart/checkout/order history.

Kiến trúc backend phân tầng.

Sprint 3 — Admin và chất lượng

Product/brand/category/order/user admin.

Swagger.

Unit test.

Docker Compose.

Sprint 4 — Release

CI/CD.

VPS/domain/HTTPS.

Regression test.

Báo cáo, minh chứng và demo.

9. Quy tắc evidence

Mỗi ticket Done nên có ít nhất một trong các minh chứng:

Link Pull Request.

Link GitHub Actions run.

Ảnh/video giao diện.

Ảnh Swagger response.

Test output.

Link Figma frame/prototype.

10. Backlog mẫu

docs/jira-backlog.csv là dữ liệu tham khảo. Trước khi import:

Kiểm tra tên cột Jira hỗ trợ.

Thay assignee theo tài khoản thật.

Không đánh dấu Done cho công việc chưa làm.

Không tạo ticket chỉ để tăng số lượng commit.