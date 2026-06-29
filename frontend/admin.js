document.addEventListener("DOMContentLoaded", function () {
    const loginOverlay = document.getElementById("admin-login-overlay");
    const loginForm = document.getElementById("admin-login-form");
    const logoutBtn = document.getElementById("logout-acc");

    let products = [];
    let orders = [];
    let users = [];

    function formatVND(num) {
        return Number(num || 0).toLocaleString("vi-VN") + " đ";
    }

    function escapeHtml(text) {
        return String(text || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    // =========================
    // 1. KIỂM TRA ĐĂNG NHẬP ADMIN
    // =========================
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if (isAdmin && loginOverlay) {
        loginOverlay.classList.remove("d-flex");
        loginOverlay.style.display = "none";
        loadAdminData();
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("admin-email").value.trim();
            const password = document.getElementById("admin-pass").value.trim();
            const errorEl = document.getElementById("admin-login-error");

            try {
                const result = await apiPost("/auth/login", {
                    email,
                    password
                });

                if (!result.user || result.user.role !== "admin") {
                    errorEl.textContent = result.message || "Tài khoản không có quyền quản trị!";
                    return;
                }

                localStorage.setItem("isAdmin", "true");
                localStorage.setItem("token", result.token);
                localStorage.setItem("loggedInUser", result.user.fullName || "Admin");
                localStorage.setItem("currentUser", JSON.stringify(result.user));

                alert("Đăng nhập thành công!");
                location.reload();
            } catch (error) {
                console.error("Lỗi đăng nhập admin:", error);
                errorEl.textContent = "Không kết nối được backend!";
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (confirm("Bạn có chắc muốn đăng xuất?")) {
                localStorage.removeItem("isAdmin");
                localStorage.removeItem("token");
                localStorage.removeItem("loggedInUser");
                localStorage.removeItem("currentUser");
                location.reload();
            }
        });
    }

    // =========================
    // 2. LOAD DATA TỪ BACKEND
    // =========================
    async function loadAdminData() {
        try {
            products = await apiGet("/products");
            orders = await apiGet("/orders");
            users = await apiGet("/users");

            renderOverview();
            showProduct();
            findOrder();
            showUser();
            renderBrands();
            renderCategories();

            console.log("Admin data:", { products, orders, users });
        } catch (error) {
            console.error("Lỗi tải dữ liệu admin:", error);
            alert("Không tải được dữ liệu từ backend!");
        }
    }

    // =========================
    // 3. DASHBOARD
    // =========================
    function renderOverview() {
        const completedOrders = orders.filter(o => o.status === "Giao thành công");
        const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const pendingOrders = orders.filter(o => o.status === "Chờ xác nhận").length;

        const elRevenue = document.getElementById("dash-revenue");
        const elOrders = document.getElementById("dash-orders");
        const elProducts = document.getElementById("dash-products");
        const elUsers = document.getElementById("dash-users");

        if (elRevenue) elRevenue.textContent = formatVND(totalRevenue);
        if (elOrders) elOrders.textContent = pendingOrders;
        if (elProducts) elProducts.textContent = products.length;
        if (elUsers) elUsers.textContent = users.length;

        renderCharts();
    }

    function renderCharts() {
        const revenueCanvas = document.getElementById("revenueChart");
        const statusCanvas = document.getElementById("statusChart");

        if (revenueCanvas && window.Chart) {
            const ctx = revenueCanvas.getContext("2d");

            const labels = orders.map(o => o.date || "Không rõ");
            const data = orders.map(o => Number(o.total || 0));

            new Chart(ctx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [{
                        label: "Doanh thu đơn hàng",
                        data
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        if (statusCanvas && window.Chart) {
            const ctx = statusCanvas.getContext("2d");

            const completed = orders.filter(o => o.status === "Giao thành công").length;
            const cancelled = orders.filter(o => o.status === "Đã hủy").length;
            const processing = orders.length - completed - cancelled;

            new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: ["Hoàn thành", "Đã hủy", "Đang xử lý"],
                    datasets: [{
                        data: [completed, cancelled, processing]
                    }]
                },
                options: {
                    responsive: true
                }
            });
        }
    }

    // =========================
    // 4. MENU SIDEBAR
    // =========================
    window.navigateTo = function (sectionId) {
        const menuItem = document.querySelector(`.sidebar-item[data-section="${sectionId}"]`);
        if (menuItem) menuItem.click();
    };

    document.querySelectorAll(".sidebar-item").forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();

            document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
            document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));

            this.classList.add("active");

            const sectionId = this.getAttribute("data-section");
            const section = document.getElementById(sectionId);

            if (section) section.classList.add("active");

            if (sectionId === "tong-quan") renderOverview();
            if (sectionId === "san-pham") showProduct();
            if (sectionId === "don-hang") findOrder();
            if (sectionId === "khach-hang") showUser();
            if (sectionId === "thuong-hieu") renderBrands();
            if (sectionId === "danh-muc") renderCategories();
        });
    });

    // =========================
    // 5. QUẢN LÝ SẢN PHẨM
    // =========================
    function showProduct() {
        const el = document.getElementById("show-product");
        if (!el) return;

        if (!products.length) {
            el.innerHTML = `
                <div class="p-4 text-center text-muted">
                    Chưa có sản phẩm nào trong database.
                </div>
            `;
            return;
        }

        let html = `
            <table class="table table-custom mb-0 align-middle">
                <thead>
                    <tr>
                        <th>Ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Thương hiệu</th>
                        <th>Loại</th>
                        <th>Giá</th>
                        <th>Tồn kho</th>
                        <th class="text-end">Hành động</th>
                    </tr>
                </thead>
                <tbody>
        `;

        products.forEach(p => {
            const firstSize = p.sizes && p.sizes.length > 0 ? p.sizes[0] : null;
            const totalStock = p.sizes ? p.sizes.reduce((sum, s) => sum + Number(s.stock || 0), 0) : 0;

            html += `
                <tr>
                    <td>
                        <img src="${escapeHtml(p.image)}" 
                             style="width:60px;height:60px;object-fit:contain;"
                             onerror="this.src='https://via.placeholder.com/60'">
                    </td>
                    <td>
                        <div class="fw-bold">${escapeHtml(p.name)}</div>
                        <div class="small text-muted">${escapeHtml(p.short || p.shortDesc || "")}</div>
                    </td>
                    <td>${escapeHtml((p.brand || "").toUpperCase())}</td>
                    <td>${escapeHtml(p.type || "")}</td>
                    <td>${firstSize ? formatVND(firstSize.price) : "Chưa có giá"}</td>
                    <td>${totalStock}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-light text-danger" onclick="window.deleteProduct('${p.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        el.innerHTML = html;
    }

    window.deleteProduct = async function (id) {
        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

        try {
            await apiDelete("/products/" + id);
            products = await apiGet("/products");
            showProduct();
            renderOverview();
            alert("Xóa sản phẩm thành công!");
        } catch (error) {
            console.error("Lỗi xóa sản phẩm:", error);
            alert("Không xóa được sản phẩm!");
        }
    };

    const btnAddProduct = document.getElementById("btn-add-product");
    if (btnAddProduct) {
        btnAddProduct.addEventListener("click", function () {
            alert("Phần thêm/sửa sản phẩm sẽ làm ở bước tiếp theo. Hiện tại admin đã xem/xóa được sản phẩm từ SQL Server.");
        });
    }

    // =========================
    // 6. QUẢN LÝ ĐƠN HÀNG
    // =========================
    function findOrder() {
        const el = document.getElementById("showOrder");
        if (!el) return;

        if (!orders.length) {
            el.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Chưa có đơn hàng nào.
                    </td>
                </tr>
            `;
            return;
        }

        el.innerHTML = "";

        orders.forEach(order => {
            el.innerHTML += `
                <tr>
                    <td>#${order.id}</td>
                    <td>
                        <div class="fw-bold">${escapeHtml(order.customerName || "Khách hàng")}</div>
                        <div class="small text-muted">${escapeHtml(order.phone || "")}</div>
                    </td>
                    <td>${escapeHtml(order.date || "")}</td>
                    <td>${formatVND(order.total)}</td>
                    <td>
                        <span class="badge bg-primary">${escapeHtml(order.status || "Chờ xác nhận")}</span>
                    </td>
                    <td>
                        <select class="form-select form-select-sm" onchange="window.updateOrderStatus('${order.id}', this.value)">
                            <option value="">Cập nhật</option>
                            <option value="Chờ xác nhận">Chờ xác nhận</option>
                            <option value="Đã xác nhận">Đã xác nhận</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Giao thành công">Giao thành công</option>
                            <option value="Đã hủy">Đã hủy</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    }

    window.updateOrderStatus = async function (id, status) {
        if (!status) return;

        try {
            await apiPost("/orders/" + id + "/status", { status });
        } catch {
            await fetch("http://localhost:3000/api/orders/" + id + "/status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
        }

        orders = await apiGet("/orders");
        findOrder();
        renderOverview();
    };

    // =========================
    // 7. QUẢN LÝ KHÁCH HÀNG
    // =========================
    function showUser() {
        const el = document.getElementById("show-user");
        if (!el) return;

        if (!users.length) {
            el.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Chưa có khách hàng nào.
                    </td>
                </tr>
            `;
            return;
        }

        el.innerHTML = "";

        users.forEach((u, index) => {
            el.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td class="fw-bold">${escapeHtml(u.fullName)}</td>
                    <td>${escapeHtml(u.email)}</td>
                    <td>${escapeHtml(u.createdAt || "")}</td>
                    <td><span class="badge bg-success">Active</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-light" disabled>
                            <i class="bi bi-person"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // =========================
    // 8. THƯƠNG HIỆU / DANH MỤC TẠM THỜI
    // =========================
    function renderBrands() {
        const el = document.getElementById("show-brand");
        if (!el) return;

        const brands = [
            { name: "Chanel", desc: "Biểu tượng thanh lịch" },
            { name: "Dior", desc: "Sang trọng quyến rũ" },
            { name: "Gucci", desc: "Đẳng cấp táo bạo" },
            { name: "Versace", desc: "Mạnh mẽ lôi cuốn" },
            { name: "YSL", desc: "Tự do phá cách" },
            { name: "Tom Ford", desc: "Bí ẩn và gợi cảm" }
        ];

        el.innerHTML = brands.map(b => `
            <tr>
                <td><div class="bg-light rounded text-center small py-1" style="width:50px">${b.name.charAt(0)}</div></td>
                <td class="fw-bold">${b.name}</td>
                <td>${b.desc}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light" disabled>
                        <i class="bi bi-pencil-square"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    function renderCategories() {
        const el = document.getElementById("show-category");
        if (!el) return;

        const categories = [
            { id: "c1", name: "Nước hoa Nam", desc: "Dành cho phái mạnh" },
            { id: "c2", name: "Nước hoa Nữ", desc: "Dành cho phái đẹp" },
            { id: "c3", name: "Nước hoa Unisex", desc: "Phi giới tính" }
        ];

        el.innerHTML = categories.map(c => `
            <tr>
                <td>${c.id}</td>
                <td class="fw-bold">${c.name}</td>
                <td>${c.desc}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light" disabled>
                        <i class="bi bi-pencil-square"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    window.addNewBrand = function () {
        alert("Phần thêm thương hiệu sẽ làm sau.");
    };

    window.addNewCategory = function () {
        alert("Phần thêm danh mục sẽ làm sau.");
    };
});