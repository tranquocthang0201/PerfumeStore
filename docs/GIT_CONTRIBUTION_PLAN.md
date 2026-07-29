# Kế hoạch contribution GitHub cho nhóm

## Nguyên tắc bắt buộc

Contribution phải phản ánh công việc thật. Không dùng `git commit --author` để giả thành viên, không chia một thay đổi thành commit rỗng và không dùng chung một tài khoản GitHub.

## Cách chia phần bản nâng cấp hiện tại

Các thay đổi đang để ở working tree/branch nâng cấp để nhóm có thể review và chia thành những commit trung thực. Không nên để một người commit toàn bộ.

Gợi ý phân chia theo vai trò:

| Nhóm việc | Phạm vi file | Jira gợi ý |
|---|---|---|
| Backend architecture | `controllers/`, `services/`, `models/`, route | PERF-10 |
| JWT & authorization | auth middleware/routes/services | PERF-11 |
| Product/order API | product/order layers | PERF-12, PERF-13 |
| Frontend API integration | `frontend/api.js`, `main.js` | PERF-14 |
| Admin dashboard integration | `frontend/admin.*` | PERF-15 |
| Swagger & tests | `src/docs/`, `tests/`, `scripts/check.js` | PERF-16 |
| Docker & database seed | Dockerfiles, Compose, SQL, seed | PERF-17 |
| CI/CD & VPS docs | workflows, deployment docs | PERF-18 |
| Figma/Jira/report | Figma file, board, screenshots, report | PERF-19 |

Chỉ giao cho thành viên phần họ thực sự đọc, sửa, kiểm thử và chịu trách nhiệm.

## Quy trình một ticket

```bash
git checkout develop
git pull
git checkout -b feature/PERF-14-frontend-api
# sửa và test
git add frontend/api.js frontend/main.js
git commit -m "PERF-14 feat(frontend): integrate authenticated order API"
git push -u origin feature/PERF-14-frontend-api
```

Sau đó mở Pull Request vào `develop`, liên kết Jira, yêu cầu ít nhất một thành viên khác review.

## Nhịp contribution đề xuất

- Mỗi thành viên có 2–4 phiên làm việc thật mỗi tuần.
- Mỗi phiên tạo 1–3 commit nhỏ, không dồn hết vào ngày cuối.
- Cuối sprint merge qua Pull Request.
- Mỗi commit phải build/test được hoặc là một bước tài liệu rõ ràng.

## Commit convention

```text
PERF-<id> <type>(<scope>): <mô tả>
```

Type: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.

Ví dụ:

```text
PERF-11 feat(auth): add JWT bearer and admin role middleware
PERF-13 fix(order): calculate total from database prices
PERF-16 test(api): verify all routes exist in OpenAPI spec
PERF-17 chore(docker): compose frontend backend and SQL Server
```

## Minh chứng cần chụp

- Contributors graph theo từng thành viên.
- Pull Requests có review chéo.
- Commit history có mã Jira và phân bố theo ngày.
- Jira ticket có link branch, commit hoặc PR.
- GitHub Actions xanh trên PR và `main`.
