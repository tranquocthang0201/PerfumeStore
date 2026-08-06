Báo cáo kiểm tra kỹ thuật PerfumeStore

Ngày cập nhật tài liệu: 06/08/2026

Người thực hiện kiểm tra: <HỌ_TÊN>

Commit/branch được kiểm tra: <COMMIT_SHA_OR_BRANCH>

Môi trường: <WINDOWS/LINUX/MACOS + NODE + DOCKER>

Tài liệu này là mẫu ghi nhận kết quả. Trước khi commit hoặc nộp đồ án, nhóm phải chạy lại các lệnh trên máy của mình và thay trạng thái bằng kết quả thật.

1. Thống kê tĩnh từ mã nguồn hiện tại

Hạng mục

Kết quả

JavaScript được scripts/check.js quét

51 tệp

Tệp unit test

6 tệp

Test case khai báo

19 test

OpenAPI path

18 path

OpenAPI operation

26 operation

Nhóm API

8 nhóm

Sản phẩm seed

49 sản phẩm

Biến thể dung tích seed

101 biến thể

Docker Compose service

3 service

2. Kiểm tra dependencies, cú pháp và unit test

Chạy trong thư mục backend:

npm ci
npm run check
npm test

Ghi kết quả thật:

Lệnh

Trạng thái

Ghi chú/Link log

npm ci

[PASS/FAIL]

<ghi chú>

npm run check

[PASS/FAIL]

Mong đợi: kiểm tra 51 tệp JavaScript

npm test

[PASS/FAIL]

Mong đợi: chạy 19 test

Các nhóm test hiện có:

JWT Bearer và role admin.

Validation chuỗi, email, mật khẩu và số.

Chuẩn hóa sản phẩm và biến thể.

Nghiệp vụ thương hiệu.

Nghiệp vụ danh mục.

Độ đầy đủ của OpenAPI và Bearer security scheme.

3. Kiểm tra Swagger và health endpoint

Khởi động backend hoặc toàn bộ Docker Compose, sau đó kiểm tra:

curl http://localhost:8080/api/health
curl http://localhost:8080/api-docs.json

Mở trình duyệt:

http://localhost:8080/api-docs

Checklist:

/api/health trả trạng thái backend/database.

/api-docs.json trả openapi: 3.0.3.

Swagger có 18 path và 26 operation.

Nút Authorize chấp nhận Bearer JWT.

API admin trả 401/403 đúng trường hợp.

4. Kiểm tra Docker Compose

Tại thư mục gốc:

docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 backend

Kết quả cần có:

Service

Trạng thái mong đợi

database

Running

backend

Running

frontend

Running, public tại port 8080 mặc định

Checklist:

Frontend mở được.

Admin page mở được.

Backend kết nối SQL Server.

Dữ liệu seed xuất hiện.

Volume SQL tồn tại sau khi restart container.

5. Kiểm tra nghiệp vụ chính

Khách hàng

Đăng ký tài khoản mới.

Đăng nhập và nhận JWT.

Xem/tìm/lọc sản phẩm.

Chọn dung tích và thêm giỏ hàng.

Đặt đơn COD hoặc QR.

Xem đúng đơn của mình.

Chỉ hủy được đơn Chờ xác nhận.

Quản trị viên

Đăng nhập admin.

Thêm/sửa/xóa sản phẩm.

Quản lý thương hiệu và danh mục.

Xem danh sách user.

Cập nhật trạng thái đơn.

Xem dashboard và cảnh báo tồn kho.

6. Kiểm tra bảo mật cơ bản

Không commit .env.

Không có private key, GitHub token hoặc mật khẩu VPS trong Git.

JWT_SECRET, MSSQL_SA_PASSWORD, ADMIN_PASSWORD đủ mạnh.

Backend không nhận giá/tổng tiền/userId từ client làm nguồn tin cậy.

SQL dùng input parameter.

CORS production chỉ cho phép domain thật.

7. Bảng tổng kết lần chạy

Hạng mục

Kết quả

Minh chứng

Syntax check

[PASS/FAIL]

<ảnh/link Actions>

Unit test

[PASS/FAIL]

<ảnh/link Actions>

Swagger

[PASS/FAIL]

<ảnh>

Docker Compose

[PASS/FAIL]

<ảnh docker compose ps>

Database integration

[PASS/FAIL]

<log/ảnh>

Customer flow

[PASS/FAIL]

<ảnh/video>

Admin flow

[PASS/FAIL]

<ảnh/video>

VPS deployment

[PASS/FAIL/NOT RUN]

<URL/link workflow>

8. Lỗi còn tồn tại

Ghi lỗi thật tại đây, không xóa mục này nếu chưa kiểm tra:

<Lỗi hoặc hạn chế 1>

<Lỗi hoặc hạn chế 2>

<Kế hoạch xử lý>