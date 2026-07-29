# Checklist Figma cho PerfumeStore

## Cấu trúc file Figma

Tạo một file duy nhất, gồm các page:

1. `00 Cover & Links`
2. `01 Research & User Flow`
3. `02 Wireframes`
4. `03 Design System`
5. `04 Customer Desktop`
6. `05 Customer Mobile`
7. `06 Admin Dashboard`
8. `07 Prototype`
9. `08 Handoff`

## Frame tối thiểu

- Trang chủ.
- Danh sách và lọc sản phẩm.
- Chi tiết sản phẩm.
- Giỏ hàng.
- Checkout.
- Đăng ký/đăng nhập.
- Hồ sơ.
- Lịch sử và chi tiết đơn hàng.
- Admin overview.
- Admin products/add/edit.
- Admin orders/status.
- Admin users.
- Responsive mobile cho luồng mua hàng chính.

## Design system

- Color styles/tokens: primary, surface, success, warning, danger, text.
- Typography styles: display, heading, body, caption.
- Spacing/radius/shadow tokens.
- Components: button variants, input, product card, badge status, navbar, modal, table, pagination.
- Component variants cho default/hover/disabled/error.

## Prototype cần demo

```text
Home → Product list → Product detail → Add to cart → Checkout → Login → Place order → Order history
```

Admin:

```text
Admin login → Dashboard → Add/edit product → Update order status
```

## Liên kết với Jira/GitHub

- Dán link frame vào ticket UI tương ứng.
- Tên frame có mã Jira, ví dụ `PERF-21 / Checkout / Desktop`.
- Khi implement xong, đính kèm ảnh before/after hoặc link PR vào ticket.
- Đặt link Figma ở README và mô tả repository sau khi nhóm có URL thật.
