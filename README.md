# 🌸 PerfumeStore - Website Bán Nước Hoa

## 📖 Giới thiệu

**PerfumeStore** là website bán nước hoa được xây dựng nhằm phục vụ cho đồ án môn học. Hệ thống cho phép khách hàng xem sản phẩm, đặt hàng trực tuyến và hỗ trợ quản trị viên quản lý sản phẩm, người dùng và đơn hàng.

---

# ✨ Chức năng chính

## 👤 Khách hàng

* Đăng ký tài khoản
* Đăng nhập hệ thống
* Xem danh sách nước hoa
* Xem chi tiết sản phẩm
* Thêm sản phẩm vào giỏ hàng
* Đặt hàng
* Xem lịch sử đơn hàng

## 👨‍💼 Quản trị viên

* Quản lý sản phẩm (Thêm, sửa, xóa)
* Quản lý người dùng
* Quản lý đơn hàng
* Quản lý dữ liệu hệ thống

---

# 🛠 Công nghệ sử dụng

## Frontend

* HTML5
* CSS3
* JavaScript

## Backend

* Node.js
* Express.js

## Cơ sở dữ liệu

* Microsoft SQL Server

## Công nghệ khác

* JWT Authentication
* RESTful API
* Git & GitHub

---

# 📂 Cấu trúc dự án

```text
PerfumeStore
│
├── backend
│   ├── database
│   ├── src
│   │   ├── config
│   │   ├── middleware
│   │   ├── routes
│   │   └── seed
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend
│   ├── index.html
│   ├── style.css
│   └── pic
│
├── README.md
└── .gitignore
```

---

# ⚙ Hướng dẫn cài đặt

## Bước 1: Clone dự án

```bash
git clone https://github.com/ten-github/PerfumeStore.git
```

## Bước 2: Di chuyển vào thư mục Backend

```bash
cd backend
```

## Bước 3: Cài đặt thư viện

```bash
npm install
```

## Bước 4: Cấu hình biến môi trường

Tạo file **.env** dựa trên file **.env.example**

Ví dụ:

```env
DB_SERVER=localhost
DB_DATABASE=PerfumeStore
DB_USER=sa
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
PORT=3000
```

---

## Bước 5: Tạo cơ sở dữ liệu

Mở **SQL Server Management Studio (SSMS)** và chạy file:

```text
backend/database/database.sql
```

---

## Bước 6: Khởi động Backend

```bash
npm start
```

hoặc

```bash
node server.js
```

---

## Bước 7: Chạy giao diện

Mở file:

```text
frontend/index.html
```

hoặc chạy bằng **Live Server** trong Visual Studio Code.

---

# 📸 Hình ảnh minh họa

Có thể bổ sung các hình ảnh sau:

* Trang chủ
* Đăng nhập
* Danh sách sản phẩm
* Chi tiết sản phẩm
* Giỏ hàng
* Thanh toán
* Trang quản trị

---

# 📦 Các thư viện sử dụng

* Express
* MSSQL
* Dotenv
* CORS
* JSON Web Token (JWT)
* BcryptJS
* Nodemon

---

# 👨‍💻 Thành viên thực hiện

| Họ và tên       | Vai trò             |
| --------------- | ------------------- |
| Trần Quốc Thắng | Phát triển hệ thống |
| Thạch Ngọc Phú  | Thiết kế giao diện  |
| Du Kiệt         | Sửa lỗi và nâng cấp |

---

# 🚀 Hướng phát triển

Trong tương lai, hệ thống có thể được mở rộng với các chức năng:

* Tìm kiếm sản phẩm
* Lọc sản phẩm theo thương hiệu, giá
* Thanh toán trực tuyến
* Đánh giá sản phẩm
* Gửi email xác nhận đơn hàng
* Theo dõi trạng thái đơn hàng
* Thống kê doanh thu
* Giao diện Responsive trên điện thoại

---

# 📄 Giấy phép

Dự án được xây dựng phục vụ mục đích học tập và nghiên cứu.

---

# ❤️ Lời cảm ơn

Nhóm xin chân thành cảm ơn giảng viên đã tận tình hướng dẫn và hỗ trợ trong suốt quá trình thực hiện đồ án. Đây là cơ hội giúp nhóm vận dụng kiến thức đã học vào thực tế, nâng cao kỹ năng lập trình, làm việc nhóm và phát triển phần mềm.

Xin chân thành cảm ơn!

