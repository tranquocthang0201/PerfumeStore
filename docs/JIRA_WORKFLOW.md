# Quy trình Jira đề xuất

## Board

Dùng Scrum board với các cột:

```text
Backlog → Selected for Development → In Progress → Code Review → Testing → Done
```

## Definition of Ready

Một ticket chỉ được kéo vào sprint khi có:

- User story hoặc mục tiêu rõ.
- Acceptance criteria kiểm thử được.
- Người phụ trách.
- Ước lượng story point.
- Link Figma/API nếu liên quan.

## Definition of Done

- Code đã push bằng tài khoản thành viên phụ trách.
- Có Pull Request và review.
- CI pass.
- Swagger cập nhật nếu API thay đổi.
- Test/manual evidence được đính kèm.
- Jira ticket có link PR/commit.
- Chức năng chạy được bằng Docker Compose.

## Sprint gợi ý

### Sprint 1 — Phân tích và thiết kế

- Requirement, use case, ERD.
- Wireframe và design system Figma.
- Product backlog, phân công, repository rules.

### Sprint 2 — Core backend/frontend

- Auth/JWT.
- Product catalog.
- Cart/checkout.
- Layered backend.

### Sprint 3 — Admin và chất lượng

- Product/order/user admin.
- Swagger.
- Test.
- Docker.

### Sprint 4 — Release

- CI/CD.
- VPS/domain/HTTPS.
- Regression test.
- Báo cáo và demo.

## Import backlog mẫu

File `jira-backlog.csv` là backlog khởi tạo để import hoặc copy vào Jira. Hãy thay assignee/estimate theo thành viên thật và trạng thái thực tế.
