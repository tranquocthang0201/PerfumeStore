Báo cáo đối chiếu yêu cầu đồ án

Ngày cập nhật tài liệu: 06/08/2026

Phạm vi: mã nguồn trong gói PerfumeStore hiện tại

Repository: <GITHUB_REPOSITORY_URL>

1. Quy ước trạng thái

Đạt: có cấu trúc mã nguồn hoặc cấu hình chứng minh rõ.

Đạt về cấu hình: đã có file cấu hình nhưng nhóm vẫn phải chạy thật và chụp minh chứng.

Chưa đủ minh chứng: không thể kết luận đạt nếu chưa có lịch sử hoặc kết quả chạy thực tế.

2. Bảng đối chiếu tổng hợp

STT

Yêu cầu

Trạng thái

Minh chứng chính

1

Frontend và backend là hai dự án rõ ràng, gọi nhau qua RESTful API

Đạt

frontend/, backend/, frontend/api.js, frontend/nginx.conf

2

Có bảo mật JWT

Đạt

auth.service.js, authMiddleware.js, các route dùng verifyToken và requireAdmin

3

Backend phân tầng routes, controllers, services, models

Đạt

backend/src/routes, controllers, services, models, middleware

4

Swagger cho từng API

Đạt

OpenAPI 3.0.3, 18 path/26 operation, /api-docs, /api-docs.json

5

Dockerize toàn bộ ứng dụng

Đạt về cấu hình

Hai Dockerfile, SQL Server service, docker-compose.yml, Nginx reverse proxy

6

GitHub có contribution thường xuyên, đều đặn của tất cả thành viên

Chưa đủ minh chứng

Cần commit thật, PR, review và lịch sử theo nhiều ngày của từng thành viên

3. Chi tiết từng yêu cầu

3.1. Tách frontend–backend và RESTful API — Đạt

frontend/ và backend/ có mã nguồn, Dockerfile và cấu hình riêng.

frontend/api.js gom các thao tác gọi API dùng chung.

Nginx reverse proxy /api/* và /api-docs sang backend.

Frontend không truy cập SQL Server trực tiếp.

Minh chứng nên chụp:

Cây thư mục repository.

Network request trên DevTools.

Trang Swagger hoặc response /api/health.

3.2. JWT và phân quyền — Đạt

Đăng nhập phát JWT có thời hạn.

Middleware chỉ chấp nhận Authorization: Bearer ....

Các thao tác quản trị yêu cầu role admin.

User chỉ được xem hoặc hủy đơn thuộc sở hữu của mình.

Khi tạo đơn, backend lấy user/email từ token thay vì tin dữ liệu client.

Minh chứng nên chụp:

Swagger Authorize bằng token user và admin.

Response 401 khi thiếu token.

Response 403 khi user gọi API admin.

3.3. Backend phân tầng — Đạt

Luồng chuẩn:

Route → Controller → Service → Model → SQL Server

Trách nhiệm từng tầng được mô tả tại docs/ARCHITECTURE.md.

3.4. Swagger cho từng API — Đạt

File đặc tả: backend/src/docs/openapi.js.

Phiên bản OpenAPI: 3.0.3.

Phiên bản API: 2.2.0.

Số lượng hiện tại: 18 path và 26 operation.

Có schema JWT Bearer và các schema dữ liệu chính.

Test openapi.test.js kiểm tra endpoint bắt buộc và Bearer JWT.

3.5. Dockerize toàn bộ — Đạt về cấu hình

database: SQL Server 2022, persistent volume.

backend: Node.js container, nhận biến môi trường và kết nối DB qua Docker network.

frontend: Nginx container, phục vụ static UI và reverse proxy.

Compose không công khai cổng backend; frontend là điểm truy cập chính.

Nhóm vẫn phải chạy và lưu minh chứng:

docker compose up -d --build
docker compose ps
curl http://localhost:8080/api/health

3.6. Contribution của tất cả thành viên — Chưa đủ minh chứng

Lịch sử trong gói mã nguồn hiện tại chủ yếu thể hiện một tác giả chính. Không được rewrite lịch sử hoặc dùng git commit --author để giả contribution.

Nhóm cần hoàn thiện bằng công việc thật:

Mỗi thành viên nhận ticket có acceptance criteria.

Dùng tài khoản và email GitHub của chính mình.

Tạo branch theo Jira ticket.

Commit nhỏ, có ý nghĩa qua nhiều ngày.

Mở Pull Request và review chéo.

Gắn link branch, commit, PR và kết quả CI vào Jira.

Xem docs/GIT_CONTRIBUTION_PLAN.md.

4. Điểm cộng

4.1. GitHub Actions CI/CD — Đạt về cấu hình

CI chạy npm ci, syntax check, unit test, build hai Docker image và validate Compose.

Deploy workflow SSH vào VPS, pull main và chạy docker compose up -d --build.

Cần cấu hình GitHub Environment production và secrets thật.

4.2. Cloud/VPS — Sẵn sàng triển khai

Có hướng dẫn tại docs/DEPLOY_VPS.md. Chỉ đánh dấu đã triển khai sau khi có:

URL/IP truy cập được.

HTTPS hoặc reverse proxy phù hợp.

Ảnh container đang chạy.

Health check thành công.

GitHub Actions deploy thành công.

5. Checklist minh chứng trước khi nộp

Cây thư mục frontend/backend.

Swagger hiển thị đầy đủ API.

Test JWT user/admin.

npm run check thành công.

npm test thành công.

docker compose ps có đủ ba service.

Health check thành công.

GitHub Actions CI xanh.

Link/ảnh VPS hoặc cloud.

Jira board, sprint và ticket có PR.

Figma prototype và design system.

Contributors graph và PR review của cả ba thành viên.