Kiến trúc hệ thống PerfumeStore

1. Tổng quan

PerfumeStore được tổ chức thành hai dự án độc lập:

frontend/: HTML, CSS, Bootstrap và JavaScript; hiển thị giao diện khách hàng và quản trị.

backend/: Node.js, Express và SQL Server; cung cấp RESTful API, xác thực JWT và xử lý nghiệp vụ.

Frontend không truy cập trực tiếp SQL Server. Mọi dữ liệu nghiệp vụ được lấy hoặc cập nhật thông qua RESTful API.

2. Sơ đồ triển khai

flowchart LR
    U[Khách hàng / Quản trị viên] -->|HTTP/HTTPS| N[Nginx + Frontend]
    N -->|/api/*| B[Express Backend :3000]
    N -->|/api-docs| B
    B -->|T-SQL tham số hóa| D[(SQL Server :1433)]

Khi chạy bằng Docker Compose:

frontend công khai cổng ${APP_PORT:-8080}.

backend chỉ expose cổng 3000 trong Docker network.

database sử dụng SQL Server 2022 và volume perfume_store_sql_data.

3. Cấu trúc thư mục chính

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
│   │   ├── seed/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── database/
│   └── Dockerfile
├── docs/
├── .github/workflows/
└── docker-compose.yml

4. Backend phân tầng

flowchart TD
    R[Routes] --> C[Controllers]
    C --> S[Services]
    S --> M[Models]
    M --> DB[(SQL Server)]
    MW[JWT / Role / Error Middleware] --> R
    CFG[Config / Env] --> MW
    CFG --> M

Tầng

Trách nhiệm

Ví dụ

Routes

Khai báo URL, HTTP method và middleware.

order.routes.js

Controllers

Đọc req, gọi service và trả HTTP response.

order.controller.js

Services

Validation, nghiệp vụ và kiểm tra quyền theo dữ liệu.

order.service.js

Models

SQL tham số hóa, transaction và mapping dữ liệu.

order.model.js

Middleware

JWT, role và xử lý lỗi tập trung.

authMiddleware.js

Config/Utils

Biến môi trường, DB pool, lỗi và hàm validation.

config/, utils/

Routes và controllers không nên chứa câu lệnh SQL. Models không nên trả response Express.

5. Luồng frontend gọi API

frontend/api.js xác định API_URL.

Frontend lấy JWT đã lưu sau khi đăng nhập.

Hàm API gắn header Authorization: Bearer <token> cho endpoint bảo vệ.

Nginx chuyển tiếp /api/* đến backend.

Backend trả JSON hoặc mã lỗi phù hợp.

Khi nhận 401, frontend xóa phiên đăng nhập hết hạn.

6. Xác thực và phân quyền JWT

sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant M as JWT Middleware
    participant S as Service

    C->>A: POST /api/auth/login
    A-->>C: JWT + user
    C->>M: Request + Bearer JWT
    M->>M: Kiểm tra chữ ký, hạn dùng, HS256
    M->>S: req.user
    S-->>C: Dữ liệu hoặc lỗi 403

Nguyên tắc bảo mật:

Mật khẩu được băm bằng bcryptjs.

JWT sử dụng secret từ biến môi trường.

verifyToken xác thực token; requireAdmin kiểm tra role.

User chỉ được xem hoặc hủy đơn thuộc sở hữu của mình.

Backend không tin userId, email, giá hoặc tổng tiền do trình duyệt tự gửi.

7. Luồng tạo đơn và kiểm soát tồn kho

Frontend gửi {productId, ml, quantity} cùng thông tin giao hàng.

Backend lấy userId và email từ JWT.

Service chuẩn hóa dữ liệu, giới hạn tối đa 50 dòng sản phẩm.

Model mở transaction SERIALIZABLE.

SQL Server khóa dòng biến thể bằng UPDLOCK, ROWLOCK.

Backend đọc giá, giảm giá và tồn kho thật từ database.

Nếu đủ hàng, backend tạo Orders, OrderItems và trừ kho.

Thành công thì commit; có lỗi thì rollback.

Khi user hủy đơn ở trạng thái Chờ xác nhận, backend hoàn lại tồn kho trong transaction.

8. Dữ liệu chính

Các bảng chính trong schema hiện tại:

Users

Products

ProductSizes

Brands

Categories

Orders

OrderItems

ProductSizes lưu dung tích, giá và tồn kho theo từng sản phẩm. OrderItems lưu bản chụp tên sản phẩm, dung tích, giá và số lượng tại thời điểm đặt hàng.

9. REST API và Swagger

Đặc tả backend/src/docs/openapi.js hiện mô tả:

8 nhóm API.

18 path.

26 operation.

Bearer JWT security scheme.

Điểm truy cập:

Swagger UI: /api-docs

OpenAPI JSON: /api-docs.json

Health check: /api/health

10. Quyết định kiến trúc

Dùng Nginx làm static server và reverse proxy để frontend và API dùng chung origin.

Tách service/model để kiểm thử nghiệp vụ dễ hơn và tránh SQL trong route.

Tính giá và kiểm tra tồn kho ở backend nhằm chống sửa dữ liệu phía client.

Dùng Docker Compose để thống nhất môi trường frontend, backend và database.

Dùng GitHub Actions để chạy syntax check, unit test, Docker build và triển khai VPS.

11. Giới hạn hiện tại

Thanh toán QR chưa có webhook hoặc đối soát tự động từ ngân hàng.

JWT đang được frontend lưu ở phía trình duyệt; cần kiểm soát XSS và cân nhắc HttpOnly cookie/refresh token ở phiên bản sau.

Cần bổ sung integration test với SQL Server chạy thật và end-to-end test cho luồng mua hàng.