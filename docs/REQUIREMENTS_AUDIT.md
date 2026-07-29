# Báo cáo đối chiếu yêu cầu đồ án

Ngày rà soát: 22/07/2026

## Kết luận

Mã nguồn ban đầu có frontend/backend riêng và một middleware JWT, nhưng nghiệp vụ SQL nằm trực tiếp trong route, API admin chưa được bảo vệ đầy đủ, frontend còn lọc đơn hàng bằng email ở trình duyệt, đồng thời chưa có Swagger, Docker, test hoặc GitHub Actions.

Phiên bản đã chỉnh sửa giải quyết toàn bộ yêu cầu kỹ thuật có thể thực hiện trong mã nguồn. Tiêu chí contribution của tất cả thành viên vẫn cần nhóm tạo lịch sử làm việc thật qua Jira, branch, commit và Pull Request.

## Đối chiếu từng tiêu chí

### 1. Tách backend–frontend và gọi RESTful API — Đạt

- `frontend/` và `backend/` độc lập.
- `frontend/api.js` là lớp gọi API dùng chung.
- Nginx phục vụ frontend và reverse proxy `/api/*` sang backend.
- Không còn lấy toàn bộ đơn hàng về trình duyệt rồi lọc theo email.

### 2. JWT — Đạt

- Đăng nhập phát JWT HS256 có hạn dùng.
- Middleware bắt buộc định dạng `Authorization: Bearer ...`.
- Phân quyền `user` và `admin`.
- Product write, danh sách user và quản trị đơn hàng chỉ cho admin.
- Người dùng chỉ xem/hủy đơn thuộc sở hữu của mình.
- Backend tự lấy email/user ID từ token khi tạo đơn.

### 3. Kiến trúc backend phân tầng — Đạt

Luồng xử lý:

```text
Route → Controller → Service → Model → SQL Server
```

- Route: khai báo URL/middleware.
- Controller: chuyển HTTP request/response.
- Service: nghiệp vụ, validation, phân quyền theo dữ liệu.
- Model: câu lệnh SQL và transaction.
- Middleware: JWT, admin, xử lý lỗi.
- Config/utils/docs/seed được tách riêng.

### 4. Swagger cho từng API — Đạt

- OpenAPI 3.0.3: `backend/src/docs/openapi.js`.
- Swagger UI: `/api-docs`.
- JSON spec: `/api-docs.json`.
- Có schema JWT Bearer và mô tả request/response cho toàn bộ route hiện tại.
- Unit test sẽ thất bại nếu thiếu operation bắt buộc.

### 5. Dockerize toàn bộ — Đạt về cấu hình

- SQL Server container.
- Backend Node container, tự chờ DB, chạy migration/seed rồi start API.
- Frontend Nginx container, reverse proxy API.
- Persistent volume cho SQL Server.
- Biến môi trường nằm ngoài mã nguồn.

Cần chạy thực tế trên máy có Docker và lưu ảnh `docker compose ps` làm minh chứng.

### 6. GitHub contribution đều đặn của tất cả thành viên — Chưa thể tự động hoàn thành

Lịch sử hiện được rà soát chỉ thể hiện một tác giả chính và nhiều file frontend từng chưa được Git theo dõi. Không nên rewrite lịch sử hoặc tạo commit giả. Nhóm phải:

1. Chia backlog thành ticket nhỏ.
2. Mỗi thành viên nhận ticket thật.
3. Commit qua nhiều ngày bằng tài khoản/email GitHub của chính mình.
4. Mở Pull Request và review chéo.
5. Gắn mã Jira trong branch/commit/PR.

Xem `GIT_CONTRIBUTION_PLAN.md`.

## Điểm cộng

### Cloud/VPS — Sẵn sàng

Có hướng dẫn Nginx/domain/HTTPS và lệnh Docker Compose trong `DEPLOY_VPS.md`. Nhóm vẫn cần sở hữu VPS/domain và cấu hình secret thực tế.

### GitHub Actions CI/CD — Đạt về cấu hình

- CI: cài dependency, syntax check, unit test, build hai Docker image, validate Compose.
- CD: khi merge `main`, SSH vào VPS, pull code và `docker compose up -d --build`.
- CD chỉ chạy thành công sau khi thêm GitHub Secrets và chuẩn bị VPS.

## Hạng mục nên bổ sung vào báo cáo nộp

- Use-case diagram và activity/sequence diagram.
- ERD từ các bảng Users, Products, ProductSizes, Orders, OrderItems.
- Test case table và ảnh 13 unit test pass.
- Ảnh Swagger với token admin/user.
- Ảnh Docker containers.
- Ảnh Jira board, sprint report, burndown hoặc cumulative flow.
- Link Figma và prototype.
- Link GitHub Actions run và deployment URL.
