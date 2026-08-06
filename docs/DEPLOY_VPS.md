# Triển khai PerfumeStore lên VPS

## 1. Chuẩn bị VPS

- Ubuntu/Debian cập nhật.
- Docker Engine và Docker Compose plugin.
- Git.
- Firewall chỉ mở SSH, HTTP và HTTPS; không nên public port SQL Server.
- Domain trỏ A record về IP VPS nếu có.

## 2. Clone và cấu hình

```bash
sudo mkdir -p /opt/perfume-store
sudo chown "$USER":"$USER" /opt/perfume-store
git clone <URL_REPOSITORY> /opt/perfume-store
cd /opt/perfume-store
cp .env.example .env
nano .env
```

Trên VPS nên đặt:

```dotenv
APP_PORT=8080
DB_EXPOSED_PORT=127.0.0.1:1433
MSSQL_SA_PASSWORD=<mật khẩu mạnh>
JWT_SECRET=<chuỗi ngẫu nhiên dài>
CORS_ORIGIN=https://ten-mien-cua-ban.vn
ADMIN_PASSWORD=<mật khẩu admin mới>
```

Lưu ý: Compose hiện nhận `DB_EXPOSED_PORT` ở dạng port; để không public SQL, có thể xóa hẳn mục `ports` của service `database` trên VPS vì backend giao tiếp qua Docker network.

## 3. Khởi động

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Kiểm tra:

```bash
curl http://127.0.0.1:8080/api/health
```

## 4. Reverse proxy và HTTPS

Có thể đặt Nginx/Caddy của host phía trước port 8080 và cấp TLS bằng Let's Encrypt. Proxy domain về `http://127.0.0.1:8080`.

Không commit certificate/private key vào Git.

## 5. GitHub Actions secrets

Trong repository, tạo Environment `production` và các secrets:

| Secret | Nội dung |
|---|---|
| `VPS_HOST` | IP/domain VPS |
| `VPS_PORT` | Port SSH, thường là 22 |
| `VPS_USER` | User deploy |
| `VPS_SSH_KEY` | Private key chỉ dành cho deploy |
| `VPS_APP_DIR` | `/opt/perfume-store` |

VPS phải có repository đã clone, file `.env` production và public key tương ứng trong `authorized_keys`.

## 6. Rollback cơ bản

```bash
cd /opt/perfume-store
git log --oneline -10
git checkout <commit-tot>
docker compose up -d --build
```

Với database, cần có chiến lược backup volume/SQL trước khi thay đổi schema quan trọng.
