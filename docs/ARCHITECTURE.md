# Kiến trúc hệ thống

## Sơ đồ container

```mermaid
flowchart LR
    U[Người dùng/Admin] -->|HTTP :8080| F[Nginx + Frontend]
    F -->|REST /api| B[Express Backend :3000]
    B -->|T-SQL| D[(SQL Server :1433)]
    F -->|/api-docs| B
```

## Sơ đồ backend phân tầng

```mermaid
flowchart TD
    R[Routes] --> C[Controllers]
    C --> S[Services]
    S --> M[Models]
    M --> DB[(SQL Server)]
    MW[JWT / Role / Error Middleware] --> R
    CFG[Config / Env] --> MW
    CFG --> M
```

## Trách nhiệm

| Tầng | Trách nhiệm | Không nên chứa |
|---|---|---|
| Routes | URL, HTTP method, middleware | SQL, nghiệp vụ |
| Controllers | Đọc request, gọi service, trả response | Query database |
| Services | Validation, nghiệp vụ, orchestration | Chi tiết HTTP/Express |
| Models | SQL parameterized, transaction, mapping | UI hoặc response HTTP |
| Middleware | JWT, role, error handling | Nghiệp vụ sản phẩm/đơn hàng |

## Luồng tạo đơn an toàn

1. Frontend gửi Bearer token và danh sách `{productId, ml, quantity}`.
2. Middleware xác thực JWT.
3. Service validate dữ liệu và lấy `userId/email` từ token.
4. Model mở transaction ở mức `SERIALIZABLE`.
5. Backend khóa dòng tồn kho, đọc giá thật từ database.
6. Nếu đủ hàng, backend tính tổng, tạo order/items và trừ kho.
7. Commit; nếu lỗi thì rollback.

Điều này ngăn frontend tự sửa giá, tổng tiền, email hoặc user ID.
