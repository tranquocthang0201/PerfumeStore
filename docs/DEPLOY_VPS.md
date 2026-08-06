Triển khai PerfumeStore lên VPS

Tài liệu này áp dụng cho cấu hình Docker Compose hiện có của dự án.

1. Kiến trúc production

Internet
  └─ Domain/HTTPS reverse proxy
      └─ Frontend Nginx :8080
          ├─ Static HTML/CSS/JS
          ├─ /api/* → Backend :3000
          └─ /api-docs → Backend :3000
                            └─ SQL Server :1433 (Docker network)

Không nên công khai SQL Server ra Internet.

2. Điều kiện chuẩn bị

VPS cần có:

Linux 64-bit.

Docker Engine và Docker Compose plugin.

Git.

User deploy không dùng chung mật khẩu với tài khoản khác.

SSH key.

Firewall chỉ mở các cổng thực sự cần thiết.

Domain trỏ về VPS nếu dùng HTTPS/domain.

3. Clone repository

sudo mkdir -p /opt/perfume-store
sudo chown "$USER":"$USER" /opt/perfume-store
git clone <GITHUB_REPOSITORY_URL> /opt/perfume-store
cd /opt/perfume-store
cp .env.example .env
nano .env

4. Cấu hình biến môi trường

Ví dụ production:

APP_PORT=8080
DB_DATABASE=PerfumeStoreDB
MSSQL_SA_PASSWORD=<MAT_KHAU_SQL_MANH>
JWT_SECRET=<CHUOI_NGAU_NHIEN_DAI>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://<DOMAIN_CUA_BAN>
ADMIN_EMAIL=<EMAIL_ADMIN>
ADMIN_PASSWORD=<MAT_KHAU_ADMIN_MANH>
ADMIN_FULL_NAME=PerfumeStore Admin

Không commit .env lên GitHub.

Không public SQL Server

Trong production, nên bỏ mục ports của service database hoặc chỉ bind vào loopback nếu cần quản trị cục bộ. Backend vẫn kết nối database bằng Docker network với host database.

5. Khởi động lần đầu

cd /opt/perfume-store
docker compose config
docker compose up -d --build
docker compose ps

Xem log:

docker compose logs -f backend
docker compose logs --tail=100 database

Kiểm tra nội bộ:

curl http://127.0.0.1:8080/api/health

Điểm truy cập mặc định:

Website: http://<VPS_IP>:8080

Admin: http://<VPS_IP>:8080/admin.html

Swagger: http://<VPS_IP>:8080/api-docs

6. Reverse proxy và HTTPS

Có thể đặt Nginx, Caddy hoặc reverse proxy tương đương trên host để:

Nhận request tại port 80/443.

Cấp HTTPS cho domain.

Chuyển tiếp về http://127.0.0.1:8080.

Sau khi dùng domain HTTPS, cập nhật:

CORS_ORIGIN=https://<DOMAIN_CUA_BAN>

Không commit certificate, private key hoặc file chứa secret.

7. GitHub Actions deployment

Workflow .github/workflows/deploy.yml chạy khi:

Push vào branch main.

Chạy thủ công bằng workflow_dispatch.

Tạo Environment production và các secrets:

Secret

Ví dụ/nội dung

VPS_HOST

IP hoặc domain VPS

VPS_PORT

Port SSH, mặc định 22

VPS_USER

User deploy

VPS_SSH_KEY

Private key dành riêng cho deploy

VPS_APP_DIR

/opt/perfume-store

VPS cần:

Repository đã clone tại VPS_APP_DIR.

File .env production có sẵn.

Public key tương ứng trong ~/.ssh/authorized_keys.

User deploy có quyền chạy Docker.

Lệnh workflow thực hiện:

git pull --ff-only origin main
docker compose up -d --build --remove-orphans
docker image prune -f

8. Quy trình release an toàn

Pull Request đã được review.

CI pass.

Backup database trước thay đổi schema quan trọng.

Merge vào main.

Theo dõi workflow deploy.

Kiểm tra health, website, admin và log.

Ghi lại commit SHA đã triển khai.

9. Backup và rollback

Backup

Nhóm cần chọn một cách backup phù hợp cho SQL Server hoặc Docker volume và kiểm thử phục hồi. Không chỉ tạo backup mà không thử restore.

Rollback mã nguồn

cd /opt/perfume-store
git log --oneline -10
git checkout <COMMIT_TOT>
docker compose up -d --build --remove-orphans

Sau khi xác minh, quay lại nhánh chính theo quy trình nhóm. Không rollback database schema một cách tùy ý nếu không có kế hoạch tương thích.

10. Kiểm tra sau deploy

docker compose ps
curl https://<DOMAIN_CUA_BAN>/api/health

Checklist:

HTTPS hợp lệ.

Website và admin.html mở được.

Swagger mở được hoặc được giới hạn theo chính sách nhóm.

Đăng nhập user/admin thành công.

Tạo đơn và cập nhật trạng thái thành công.

CORS không chặn domain thật.

SQL Server không public ra Internet.

Log không có lỗi lặp lại.

11. Xử lý lỗi thường gặp

Backend không kết nối database

docker compose logs --tail=200 database
docker compose logs --tail=200 backend

Kiểm tra MSSQL_SA_PASSWORD, tên database và trạng thái container.

Frontend mở được nhưng API lỗi

Kiểm tra:

frontend/nginx.conf.

Container backend có chạy hay không.

/api/health.

CORS và domain.

Deploy workflow thất bại

Kiểm tra GitHub Secrets, SSH key, quyền thư mục, quyền Docker và branch main trên VPS.