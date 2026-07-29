# Báo cáo kiểm tra kỹ thuật

Ngày kiểm tra: 22/07/2026

## Kết quả tự động

- `npm run check`: đạt, 37 file JavaScript không có lỗi cú pháp.
- `npm test`: đạt 13/13 unit test.
- Backend smoke test: đạt.
  - `GET /` trả tên/version/docs.
  - `GET /api-docs.json` trả OpenAPI 3.0.3.
  - OpenAPI hiện có 13 path và 17 operation.
  - `GET /api-docs` phục vụ trang Swagger UI.
- YAML parse: `docker-compose.yml`, CI workflow và deploy workflow hợp lệ về cú pháp YAML.
- Seed catalog: 49 sản phẩm, 101 biến thể dung tích; 49/49 đường dẫn ảnh tồn tại.
- Secret scan cơ bản: không phát hiện private key, GitHub token hoặc AWS access key trong mã nguồn.
- Git diff check: không có conflict marker hoặc whitespace error trong diff tracked.

## Giới hạn môi trường kiểm tra

Máy kiểm tra không cài Docker nên chưa thể thực sự build/start ba container SQL Server, backend và frontend. Các Dockerfile/Compose đã được viết ở trạng thái build-ready và CI sẽ thực hiện Docker build trên GitHub runner. Nhóm cần chạy `docker compose up -d --build` trên máy có Docker trước khi nộp và lưu ảnh minh chứng.

Không có SQL Server đang chạy trong môi trường kiểm tra, vì vậy các integration test cần database chưa được thực thi. Unit test và smoke test không phụ thuộc database đã đạt.
