# PerfumeStore — Website bán nước hoa

Đồ án Công nghệ phần mềm gồm **hai dự án tách biệt**:

- `frontend/`: HTML, CSS, Bootstrap, JavaScript; gọi backend bằng RESTful API.
- `backend/`: Node.js, Express, SQL Server; kiến trúc `routes → controllers → services → models`.

Toàn bộ hệ thống có thể chạy bằng Docker Compose, dùng JWT Bearer cho xác thực/phân quyền và có Swagger UI cho từng API.

## 1. Mức độ đáp ứng yêu cầu

| Yêu cầu | Trạng thái | Minh chứng |
|---|---|---|
| Backend và frontend là hai dự án riêng, gọi REST API | Đạt | `frontend/api.js`, `backend/src/app.js` |
| Bảo mật JWT | Đạt | `backend/src/middleware/authMiddleware.js`, các route có `verifyToken`/`requireAdmin` |
| Backend phân tầng | Đạt | `src/routes`, `controllers`, `services`, `models` |
| Swagger cho API | Đạt | `/api-docs`, `/api-docs.json`, `backend/src/docs/openapi.js` |
| Dockerize toàn bộ ứng dụng | Đạt về mã nguồn | `docker-compose.yml`, hai `Dockerfile`, Nginx reverse proxy |
| Contribution thường xuyên của mọi thành viên | Cần nhóm thực hiện tiếp | Xem `docs/GIT_CONTRIBUTION_PLAN.md`; không được tạo commit giả |
| Cloud/VPS | Sẵn sàng triển khai | `docs/DEPLOY_VPS.md` |
| GitHub Actions CI/CD | Đạt về cấu hình | `.github/workflows/ci.yml`, `deploy.yml` |

Báo cáo đối chiếu chi tiết nằm tại `docs/REQUIREMENTS_AUDIT.md`.

## 2. Kiến trúc

```text
Browser
  └─ Nginx frontend (port 8080)
      ├─ Static UI: HTML/CSS/JS
      └─ /api/* reverse proxy
           └─ Express backend (port 3000)
               ├─ routes
               ├─ controllers
               ├─ services
               ├─ models
               └─ SQL Server (port 1433)
```

Xem sơ đồ và trách nhiệm từng tầng tại `docs/ARCHITECTURE.md`.

## 3. Chạy nhanh bằng Docker

Yêu cầu: Docker Engine/Desktop có Docker Compose.

```bash
cp .env.example .env
```

Đổi tối thiểu hai biến trong `.env`:

```dotenv
MSSQL_SA_PASSWORD=MatKhauSQL_DuManh!
JWT_SECRET=chuoi-ngau-nhien-rat-dai-khong-duoc-commit
```

Khởi động:

```bash
docker compose up -d --build
```

Truy cập:

- Website: `http://localhost:8080`
- Admin: `http://localhost:8080/admin.html`
- Swagger: `http://localhost:8080/api-docs`
- Health check: `http://localhost:8080/api/health`

Tài khoản admin phát triển mặc định lấy từ `.env`:

```text
admin@perfume.vn / Admin@123
```

Phải đổi mật khẩu này khi demo công khai hoặc triển khai thật.

Dừng ứng dụng:

```bash
docker compose down
```

Xóa cả dữ liệu SQL để tạo lại từ đầu:

```bash
docker compose down -v
```

## 4. Chạy local không dùng Docker

1. Cài SQL Server và tạo `backend/.env` từ `backend/.env.example`.
2. Cài dependencies và khởi tạo database:

```bash
cd backend
npm ci
npm run db:init
npm run dev
```

3. Phục vụ thư mục frontend bằng một web server tĩnh, ví dụ VS Code Live Server ở port `8080`.

Không nên mở `index.html` trực tiếp bằng `file://` khi demo chính thức.

## 5. API và bảo mật

Các nhóm endpoint chính:

- `/api/auth`: đăng ký, đăng nhập, hồ sơ hiện tại.
- `/api/products`: xem sản phẩm công khai; thêm/sửa/xóa chỉ dành cho admin.
- `/api/orders`: tạo/xem đơn của chính người dùng; quản trị đơn dành cho admin.
- `/api/brands`: xem danh sách hãng; thêm/sửa/xóa thương hiệu dành cho admin.
- `/api/reports/dashboard`: dữ liệu doanh số, trạng thái đơn, top sản phẩm và cảnh báo tồn kho dành cho admin.
- `/api/users`: danh sách user dành cho admin; cập nhật hồ sơ của chính user.

Frontend tự gửi token theo header:

```http
Authorization: Bearer <JWT>
```

Backend không tin giá, tổng tiền, email hoặc quyền admin do trình duyệt gửi lên. Giá và tồn kho được đọc lại từ database trong transaction trước khi tạo đơn.

## 6. Kiểm tra chất lượng

```bash
cd backend
npm run check
npm test
```

Hiện có unit test cho validation, JWT/role, service sản phẩm, service thương hiệu và độ đầy đủ của OpenAPI.


## 7. Quản lý thương hiệu và báo cáo

- Thương hiệu được lưu trong bảng `Brands`, không còn là dữ liệu viết cứng ở frontend.
- Admin có thể thêm, sửa và xóa thương hiệu tại trang `admin.html`. Thương hiệu đang có sản phẩm sẽ không được phép xóa.
- Form sản phẩm tự nạp danh sách thương hiệu từ `/api/brands`.
- Trang báo cáo lấy dữ liệu thật từ `/api/reports/dashboard` và tự làm mới mỗi 15 giây.
- Đơn mới ở trạng thái `Chờ xác nhận` xuất hiện trong số đơn chờ, biểu đồ giá trị đơn và top sản phẩm.
- Chỉ đơn `Giao thành công` mới được tính vào **doanh thu thực nhận** trên dashboard.

## 8. Quy trình nhóm đề xuất

- Mỗi chức năng phải có Jira ticket dạng `PERF-xx`.
- Mỗi thành viên dùng branch riêng: `feature/PERF-xx-ten-ngan`.
- Commit nhỏ, có ý nghĩa và gắn mã ticket, ví dụ:

```text
PERF-12 feat(auth): protect admin product routes with JWT
```

- Mở Pull Request, người khác review, CI xanh mới merge.
- Không dùng một tài khoản Git cho cả nhóm và không sửa author để giả contribution.
- Figma cần lưu wireframe, design system, prototype và link vào Jira/README.

Chi tiết: `docs/GIT_CONTRIBUTION_PLAN.md`, `docs/JIRA_WORKFLOW.md`, `docs/FIGMA_HANDOFF.md`.

## 9. Cấu trúc thư mục quan trọng

```text
.
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── api.js
│   ├── main.js
│   ├── admin.js
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── docs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── seed/
│   │   └── utils/
│   ├── tests/
│   ├── database/
│   └── Dockerfile
├── docs/
├── .github/workflows/
└── docker-compose.yml
```

## 10. Lưu ý trước khi nộp

- Chụp Swagger hiển thị endpoint và thao tác Authorize JWT.
- Chụp `docker compose ps` với đủ ba container.
- Chụp tab Actions có workflow CI thành công.
- Xuất Jira backlog/sprint/report và link Figma prototype.
- Đảm bảo biểu đồ contribution có commit thật của tất cả thành viên trong nhiều ngày.
- Không commit `.env`, private key, mật khẩu VPS hoặc token.

## Nâng cấp quản trị 2.2

- Thương hiệu có thể lưu logo bằng URL/đường dẫn hoặc chọn file ảnh trực tiếp trong trang admin. Logo được hiển thị động tại slider và trang thương hiệu của frontend.
- Danh mục được quản lý bằng REST API `/api/categories`; admin có thể thêm, sửa, xóa và chọn danh mục khi tạo sản phẩm.
- Cảnh báo tồn kho được nhóm theo sản phẩm và giới hạn chiều cao để dashboard gọn hơn.
- Khi nâng cấp từ phiên bản cũ, chỉ cần chạy lại `docker compose up -d --build`; entrypoint backend tự tạo bảng `Categories` và nâng cột `Brands.logo` lên `NVARCHAR(MAX)`.
