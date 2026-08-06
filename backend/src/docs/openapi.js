const { env } = require("../config/env");

const bearerSecurity = [{ bearerAuth: [] }];
const jsonContent = (schema) => ({ "application/json": { schema } });
const messageResponse = (description) => ({
    description,
    content: jsonContent({ $ref: "#/components/schemas/Message" })
});

const openapi = {
    openapi: "3.0.3",
    info: {
        title: "PerfumeStore REST API",
        version: "2.2.0",
        description: "Tài liệu API cho đồ án website bán nước hoa. Các API có biểu tượng ổ khóa yêu cầu JWT Bearer token."
    },
    servers: [
        { url: `http://localhost:${env.port}`, description: "Backend chạy trực tiếp" },
        { url: "/", description: "Qua Docker/Nginx reverse proxy" }
    ],
    tags: [
        { name: "Health" },
        { name: "Authentication" },
        { name: "Products" },
        { name: "Orders" },
        { name: "Users" },
        { name: "Brands" },
        { name: "Categories" },
        { name: "Reports" }
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
        },
        schemas: {
            Message: {
                type: "object",
                properties: { message: { type: "string" } }
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    fullName: { type: "string", example: "Nguyễn Văn A" },
                    email: { type: "string", format: "email", example: "user@example.com" },
                    phone: { type: "string", example: "0901234567" },
                    address: { type: "string", example: "TP. Hồ Chí Minh" },
                    role: { type: "string", enum: ["user", "admin"] }
                }
            },
            Brand: {
                type: "object",
                properties: {
                    id: { type: "integer", readOnly: true },
                    name: { type: "string", example: "Dior" },
                    slug: { type: "string", example: "dior" },
                    description: { type: "string", example: "Thương hiệu nước hoa cao cấp" },
                    logo: { type: "string", example: "pic/brands/dior.png" },
                    productCount: { type: "integer", readOnly: true }
                }
            },
            Category: {
                type: "object",
                properties: {
                    id: { type: "integer", readOnly: true },
                    name: { type: "string", example: "Nước hoa Mini" },
                    slug: { type: "string", example: "nuoc-hoa-mini" },
                    description: { type: "string", example: "Các chai nước hoa dung tích nhỏ" },
                    productCount: { type: "integer", readOnly: true }
                }
            },
            ProductSize: {
                type: "object",
                required: ["ml", "price", "stock"],
                properties: {
                    id: { type: "integer", readOnly: true },
                    ml: { type: "integer", example: 50 },
                    price: { type: "number", example: 3200000 },
                    stock: { type: "integer", example: 10 }
                }
            },
            ProductInput: {
                type: "object",
                required: ["name", "type", "brand", "sizes"],
                properties: {
                    code: { type: "string", example: "dior-1" },
                    name: { type: "string", example: "Dior Sauvage Elixir" },
                    image: { type: "string", example: "pic/diorsauvage.jpg" },
                    shortDesc: { type: "string", example: "Hương thơm đậm đặc, nam tính." },
                    type: { type: "string", example: "nam", description: "Slug của danh mục" },
                    brand: { type: "string", example: "dior" },
                    discount: { type: "integer", minimum: 0, maximum: 99, example: 20 },
                    isNew: { type: "boolean", example: true },
                    isFeatured: { type: "boolean", example: false },
                    sizes: { type: "array", items: { $ref: "#/components/schemas/ProductSize" } }
                }
            },
            Product: {
                allOf: [
                    { $ref: "#/components/schemas/ProductInput" },
                    {
                        type: "object",
                        properties: {
                            id: { type: "string", example: "dior-1" },
                            dbId: { type: "integer", example: 1 }
                        }
                    }
                ]
            },
            OrderItemInput: {
                type: "object",
                required: ["productId", "ml", "quantity"],
                properties: {
                    productId: { type: "string", example: "dior-1" },
                    ml: { type: "integer", example: 50 },
                    quantity: { type: "integer", example: 1 }
                }
            },
            Order: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    userId: { type: "integer" },
                    customerName: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "string" },
                    address: { type: "string" },
                    total: { type: "number" },
                    status: { type: "string" },
                    paymentMethod: { type: "string" },
                    date: { type: "string" },
                    items: { type: "array", items: { type: "object" } }
                }
            },
            Error: {
                type: "object",
                properties: { message: { type: "string" }, details: { type: "object" } }
            }
        }
    },
    paths: {
        "/api/health": {
            get: {
                tags: ["Health"], summary: "Kiểm tra backend và database",
                responses: { "200": { description: "Hệ thống hoạt động" }, "500": messageResponse("Database lỗi") }
            }
        },
        "/api/auth/register": {
            post: {
                tags: ["Authentication"], summary: "Đăng ký tài khoản",
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["fullName", "email", "password"],
                    properties: {
                        fullName: { type: "string" }, email: { type: "string", format: "email" },
                        password: { type: "string", minLength: 8 }, phone: { type: "string" }, address: { type: "string" }
                    }
                }) },
                responses: { "201": { description: "Đăng ký thành công" }, "400": messageResponse("Dữ liệu không hợp lệ"), "409": messageResponse("Email đã tồn tại") }
            }
        },
        "/api/auth/login": {
            post: {
                tags: ["Authentication"], summary: "Đăng nhập và nhận JWT",
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["email", "password"],
                    properties: { email: { type: "string", format: "email" }, password: { type: "string" } }
                }) },
                responses: { "200": { description: "Đăng nhập thành công" }, "401": messageResponse("Sai thông tin đăng nhập") }
            }
        },
        "/api/auth/me": {
            get: {
                tags: ["Authentication"], summary: "Lấy người dùng hiện tại", security: bearerSecurity,
                responses: { "200": { description: "Thông tin người dùng", content: jsonContent({ $ref: "#/components/schemas/User" }) }, "401": messageResponse("Chưa đăng nhập") }
            }
        },
        "/api/products": {
            get: {
                tags: ["Products"], summary: "Danh sách sản phẩm",
                parameters: [
                    { in: "query", name: "brand", schema: { type: "string" } },
                    { in: "query", name: "type", schema: { type: "string" } },
                    { in: "query", name: "search", schema: { type: "string" } }
                ],
                responses: { "200": { description: "Danh sách sản phẩm", content: jsonContent({ type: "array", items: { $ref: "#/components/schemas/Product" } }) } }
            },
            post: {
                tags: ["Products"], summary: "Thêm sản phẩm (admin)", security: bearerSecurity,
                requestBody: { required: true, content: jsonContent({ $ref: "#/components/schemas/ProductInput" }) },
                responses: { "201": { description: "Đã tạo" }, "400": messageResponse("Dữ liệu không hợp lệ"), "403": messageResponse("Không có quyền") }
            }
        },
        "/api/products/{id}": {
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, description: "Database ID hoặc product code" }],
            get: {
                tags: ["Products"], summary: "Chi tiết sản phẩm",
                responses: { "200": { description: "Sản phẩm", content: jsonContent({ $ref: "#/components/schemas/Product" }) }, "404": messageResponse("Không tìm thấy") }
            },
            put: {
                tags: ["Products"], summary: "Cập nhật sản phẩm (admin)", security: bearerSecurity,
                requestBody: { required: true, content: jsonContent({ $ref: "#/components/schemas/ProductInput" }) },
                responses: { "200": { description: "Đã cập nhật" }, "403": messageResponse("Không có quyền"), "404": messageResponse("Không tìm thấy") }
            },
            delete: {
                tags: ["Products"], summary: "Xóa sản phẩm (admin)", security: bearerSecurity,
                responses: { "200": messageResponse("Đã xóa"), "403": messageResponse("Không có quyền"), "404": messageResponse("Không tìm thấy") }
            }
        },
        "/api/brands": {
            get: {
                tags: ["Brands"], summary: "Danh sách thương hiệu",
                responses: { "200": { description: "Danh sách thương hiệu", content: jsonContent({ type: "array", items: { $ref: "#/components/schemas/Brand" } }) } }
            },
            post: {
                tags: ["Brands"], summary: "Thêm thương hiệu (admin)", security: bearerSecurity,
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["name"],
                    properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" }, logo: { type: "string" } }
                }) },
                responses: { "201": { description: "Đã tạo" }, "403": messageResponse("Không có quyền"), "409": messageResponse("Thương hiệu đã tồn tại") }
            }
        },
        "/api/brands/{id}": {
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            put: {
                tags: ["Brands"], summary: "Cập nhật thương hiệu (admin)", security: bearerSecurity,
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["name"],
                    properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" }, logo: { type: "string" } }
                }) },
                responses: { "200": { description: "Đã cập nhật" }, "404": messageResponse("Không tìm thấy") }
            },
            delete: {
                tags: ["Brands"], summary: "Xóa thương hiệu chưa được sử dụng (admin)", security: bearerSecurity,
                responses: { "200": messageResponse("Đã xóa"), "409": messageResponse("Thương hiệu đang được sử dụng") }
            }
        },
        "/api/categories": {
            get: {
                tags: ["Categories"], summary: "Danh sách danh mục",
                responses: { "200": { description: "Danh sách danh mục", content: jsonContent({ type: "array", items: { $ref: "#/components/schemas/Category" } }) } }
            },
            post: {
                tags: ["Categories"], summary: "Thêm danh mục (admin)", security: bearerSecurity,
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["name"],
                    properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" } }
                }) },
                responses: { "201": { description: "Đã tạo" }, "403": messageResponse("Không có quyền"), "409": messageResponse("Danh mục đã tồn tại") }
            }
        },
        "/api/categories/{id}": {
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            put: {
                tags: ["Categories"], summary: "Cập nhật danh mục (admin)", security: bearerSecurity,
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["name"],
                    properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" } }
                }) },
                responses: { "200": { description: "Đã cập nhật" }, "404": messageResponse("Không tìm thấy") }
            },
            delete: {
                tags: ["Categories"], summary: "Xóa danh mục chưa được sử dụng (admin)", security: bearerSecurity,
                responses: { "200": messageResponse("Đã xóa"), "409": messageResponse("Danh mục đang được sử dụng") }
            }
        },
        "/api/reports/dashboard": {
            get: {
                tags: ["Reports"], summary: "Dữ liệu dashboard và báo cáo (admin)", security: bearerSecurity,
                responses: { "200": { description: "Dữ liệu tổng hợp đơn hàng, doanh số, sản phẩm và tồn kho" }, "403": messageResponse("Không có quyền") }
            }
        },
        "/api/orders": {
            get: {
                tags: ["Orders"], summary: "Danh sách toàn bộ đơn hàng (admin)", security: bearerSecurity,
                responses: { "200": { description: "Danh sách đơn", content: jsonContent({ type: "array", items: { $ref: "#/components/schemas/Order" } }) }, "403": messageResponse("Không có quyền") }
            },
            post: {
                tags: ["Orders"], summary: "Tạo đơn hàng", security: bearerSecurity,
                description: "Tổng tiền và giá sản phẩm được tính lại ở backend, không tin dữ liệu giá từ frontend.",
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["customerName", "phone", "address", "items"],
                    properties: {
                        customerName: { type: "string" }, phone: { type: "string" }, address: { type: "string" },
                        paymentMethod: { type: "string", enum: ["COD", "Chuyển khoản / QR"] },
                        items: { type: "array", items: { $ref: "#/components/schemas/OrderItemInput" } }
                    }
                }) },
                responses: { "201": { description: "Đặt hàng thành công" }, "401": messageResponse("Chưa đăng nhập"), "409": messageResponse("Không đủ tồn kho") }
            }
        },
        "/api/orders/my": {
            get: {
                tags: ["Orders"], summary: "Đơn hàng của người đăng nhập", security: bearerSecurity,
                responses: { "200": { description: "Danh sách đơn của tôi", content: jsonContent({ type: "array", items: { $ref: "#/components/schemas/Order" } }) } }
            }
        },
        "/api/orders/{id}": {
            get: {
                tags: ["Orders"], summary: "Chi tiết đơn hàng", security: bearerSecurity,
                parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
                responses: { "200": { description: "Chi tiết đơn", content: jsonContent({ $ref: "#/components/schemas/Order" }) }, "403": messageResponse("Không có quyền"), "404": messageResponse("Không tìm thấy") }
            }
        },
        "/api/orders/{id}/status": {
            patch: {
                tags: ["Orders"], summary: "Cập nhật trạng thái đơn (admin)", security: bearerSecurity,
                parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["status"],
                    properties: { status: { type: "string", enum: ["Chờ xác nhận", "Đã xác nhận", "Đang giao", "Giao thành công", "Đã hủy"] } }
                }) },
                responses: { "200": messageResponse("Đã cập nhật"), "403": messageResponse("Không có quyền") }
            }
        },
        "/api/orders/{id}/cancel": {
            patch: {
                tags: ["Orders"], summary: "Khách hàng hủy đơn của mình", security: bearerSecurity,
                parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
                responses: { "200": messageResponse("Đã hủy"), "409": messageResponse("Đơn không thể hủy") }
            }
        },
        "/api/users": {
            get: {
                tags: ["Users"], summary: "Danh sách người dùng (admin)", security: bearerSecurity,
                responses: { "200": { description: "Danh sách người dùng", content: jsonContent({ type: "array", items: { $ref: "#/components/schemas/User" } }) }, "403": messageResponse("Không có quyền") }
            }
        },
        "/api/users/me": {
            put: {
                tags: ["Users"], summary: "Cập nhật hồ sơ của tôi", security: bearerSecurity,
                requestBody: { required: true, content: jsonContent({
                    type: "object", required: ["fullName"],
                    properties: { fullName: { type: "string" }, phone: { type: "string" }, address: { type: "string" } }
                }) },
                responses: { "200": { description: "Đã cập nhật" }, "401": messageResponse("Chưa đăng nhập") }
            }
        }
    }
};

module.exports = openapi;
