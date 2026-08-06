document.addEventListener("DOMContentLoaded", function () {
    const loginOverlay = document.getElementById("admin-login-overlay");
    const loginForm = document.getElementById("admin-login-form");
    const logoutBtn = document.getElementById("logout-acc");

    let products = [];
    let orders = [];
    let users = [];
    let brands = [];
    let categories = [];
    let reportData = null;
    const charts = {};

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

    function displayType(type) {
        return categories.find((category) => category.slug === type)?.name || type || "Không rõ";
    }

    function destroyChart(name) {
        if (charts[name]) {
            charts[name].destroy();
            charts[name] = null;
        }
    }

    function currentSectionId() {
        return document.querySelector(".section.active")?.id || "tong-quan";
    }

    async function restoreAdminSession() {
        if (!localStorage.getItem("token")) return;
        try {
            const user = await apiGet("/auth/me");
            if (user.role !== "admin") throw new Error("Tài khoản không có quyền quản trị");
            localStorage.setItem("isAdmin", "true");
            localStorage.setItem("currentUser", JSON.stringify(user));
            if (loginOverlay) {
                loginOverlay.classList.remove("d-flex");
                loginOverlay.style.display = "none";
            }
            await loadAdminData();
            startAutoRefresh();
        } catch (error) {
            localStorage.removeItem("isAdmin");
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
        }
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const email = document.getElementById("admin-email").value.trim();
            const password = document.getElementById("admin-pass").value.trim();
            const errorEl = document.getElementById("admin-login-error");

            try {
                const result = await apiPost("/auth/login", { email, password });
                if (!result.user || result.user.role !== "admin") {
                    errorEl.textContent = result.message || "Tài khoản không có quyền quản trị!";
                    return;
                }
                localStorage.setItem("isAdmin", "true");
                localStorage.setItem("token", result.token);
                localStorage.setItem("loggedInUser", result.user.fullName || "Admin");
                localStorage.setItem("currentUser", JSON.stringify(result.user));
                location.reload();
            } catch (error) {
                console.error("Lỗi đăng nhập admin:", error);
                errorEl.textContent = error.message || "Không kết nối được backend!";
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

    async function loadAdminData({ silent = false } = {}) {
        try {
            [products, orders, users, brands, categories, reportData] = await Promise.all([
                apiGet("/products"),
                apiGet("/orders"),
                apiGet("/users"),
                apiGet("/brands"),
                apiGet("/categories"),
                apiGet("/reports/dashboard")
            ]);

            renderOverview();
            showProduct();
            findOrder();
            showUser();
            renderBrands();
            renderCategories();
            populateBrandSelect();
            populateCategorySelect();
            if (currentSectionId() === "thong-ke") renderReports();
        } catch (error) {
            console.error("Lỗi tải dữ liệu admin:", error);
            if (!silent) alert(error.message || "Không tải được dữ liệu từ backend!");
        }
    }

    async function refreshOrdersAndReports({ silent = true } = {}) {
        try {
            [orders, reportData] = await Promise.all([
                apiGet("/orders"),
                apiGet("/reports/dashboard")
            ]);
            renderOverview();
            if (currentSectionId() === "don-hang") findOrder();
            if (currentSectionId() === "thong-ke") renderReports();
        } catch (error) {
            console.error("Lỗi làm mới đơn hàng/báo cáo:", error);
            if (!silent) alert(error.message || "Không thể làm mới báo cáo.");
        }
    }

    let refreshTimer = null;
    function startAutoRefresh() {
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = setInterval(() => {
            if (localStorage.getItem("token")) refreshOrdersAndReports({ silent: true });
        }, 15000);
    }

    function renderOverview() {
        const summary = reportData?.summary;
        const completedOrders = orders.filter((o) => o.status === "Giao thành công");
        const totalRevenue = summary?.completedRevenue ?? completedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const pendingOrders = summary?.pendingOrders ?? orders.filter((o) => o.status === "Chờ xác nhận").length;

        const elRevenue = document.getElementById("dash-revenue");
        const elOrders = document.getElementById("dash-orders");
        const elProducts = document.getElementById("dash-products");
        const elUsers = document.getElementById("dash-users");

        if (elRevenue) elRevenue.textContent = formatVND(totalRevenue);
        if (elOrders) elOrders.textContent = pendingOrders;
        if (elProducts) elProducts.textContent = summary?.totalProducts ?? products.length;
        if (elUsers) elUsers.textContent = summary?.totalUsers ?? users.filter((u) => u.role !== "admin").length;

        renderOverviewCharts();
    }

    function renderOverviewCharts() {
        const revenueCanvas = document.getElementById("revenueChart");
        const statusCanvas = document.getElementById("statusChart");

        if (revenueCanvas && window.Chart) {
            destroyChart("revenue");
            const daily = reportData?.daily || [];
            const labels = daily.length ? daily.map((item) => item.date) : orders.map((o) => o.date || "Không rõ");
            const values = daily.length ? daily.map((item) => item.orderValue) : orders.filter((o) => o.status !== "Đã hủy").map((o) => Number(o.total || 0));

            charts.revenue = new Chart(revenueCanvas.getContext("2d"), {
                type: "bar",
                data: {
                    labels,
                    datasets: [{ label: "Giá trị đơn hàng (không gồm đơn hủy)", data: values }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        if (statusCanvas && window.Chart) {
            destroyChart("status");
            const statuses = reportData?.orderStatus || [];
            const labels = statuses.length ? statuses.map((item) => item.status) : ["Giao thành công", "Đã hủy", "Đang xử lý"];
            const values = statuses.length
                ? statuses.map((item) => item.orderCount)
                : [
                    orders.filter((o) => o.status === "Giao thành công").length,
                    orders.filter((o) => o.status === "Đã hủy").length,
                    orders.filter((o) => !["Giao thành công", "Đã hủy"].includes(o.status)).length
                ];

            charts.status = new Chart(statusCanvas.getContext("2d"), {
                type: "doughnut",
                data: { labels, datasets: [{ data: values }] },
                options: { responsive: true }
            });
        }
    }

    window.navigateTo = function (sectionId) {
        const menuItem = document.querySelector(`.sidebar-item[data-section="${sectionId}"]`);
        if (menuItem) menuItem.click();
    };

    document.querySelectorAll(".sidebar-item").forEach((item) => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            document.querySelectorAll(".sidebar-item").forEach((i) => i.classList.remove("active"));
            document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
            this.classList.add("active");

            const sectionId = this.getAttribute("data-section");
            document.getElementById(sectionId)?.classList.add("active");

            if (sectionId === "tong-quan") renderOverview();
            if (sectionId === "san-pham") showProduct();
            if (sectionId === "don-hang") {
                findOrder();
                refreshOrdersAndReports({ silent: true });
            }
            if (sectionId === "khach-hang") showUser();
            if (sectionId === "thuong-hieu") renderBrands();
            if (sectionId === "danh-muc") renderCategories();
            if (sectionId === "thong-ke") {
                renderReports();
                refreshOrdersAndReports({ silent: true });
            }
        });
    });

    function showProduct() {
        const el = document.getElementById("show-product");
        if (!el) return;
        if (!products.length) {
            el.innerHTML = '<div class="p-4 text-center text-muted">Chưa có sản phẩm nào trong database.</div>';
            return;
        }

        let html = `
            <table class="table table-custom mb-0 align-middle">
                <thead><tr><th>Ảnh</th><th>Tên sản phẩm</th><th>Thương hiệu</th><th>Loại</th><th>Giá</th><th>Tồn kho</th><th class="text-end">Hành động</th></tr></thead>
                <tbody>`;

        products.forEach((p) => {
            const firstSize = p.sizes?.[0];
            const totalStock = (p.sizes || []).reduce((sum, size) => sum + Number(size.stock || 0), 0);
            const brandName = brands.find((brand) => brand.slug === p.brand)?.name || String(p.brand || "").toUpperCase();
            html += `
                <tr>
                    <td><img src="${escapeHtml(p.image)}" style="width:60px;height:60px;object-fit:contain;" onerror="this.src='https://via.placeholder.com/60'"></td>
                    <td>
                        <div class="fw-bold">${escapeHtml(p.name)}</div>
                        <div class="d-flex flex-wrap gap-1 my-1">
                            ${Number(p.discount || 0) > 0 ? `<span class="badge bg-danger">Giảm ${Number(p.discount)}%</span>` : ""}
                            ${p.isNew ? '<span class="badge bg-success">Mới</span>' : ""}
                            ${p.isFeatured ? '<span class="badge bg-warning text-dark">Nổi bật</span>' : ""}
                        </div>
                        <div class="small text-muted">${escapeHtml(p.short || p.shortDesc || "")}</div>
                    </td>
                    <td>${escapeHtml(brandName)}</td>
                    <td>${escapeHtml(displayType(p.type))}</td>
                    <td>${firstSize ? formatVND(firstSize.price) : "Chưa có giá"}</td>
                    <td>${totalStock}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-light text-primary me-1" onclick="window.editProduct('${escapeHtml(p.id)}')" title="Sửa"><i class="bi bi-pencil-square"></i></button>
                        <button class="btn btn-sm btn-light text-danger" onclick="window.deleteProduct('${escapeHtml(p.id)}')" title="Xóa"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>`;
        });

        html += "</tbody></table>";
        el.innerHTML = html;
    }

    window.deleteProduct = async function (id) {
        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            await apiDelete("/products/" + id);
            products = await apiGet("/products");
            reportData = await apiGet("/reports/dashboard");
            showProduct();
            renderOverview();
            if (currentSectionId() === "thong-ke") renderReports();
            alert("Xóa sản phẩm thành công!");
        } catch (error) {
            console.error("Lỗi xóa sản phẩm:", error);
            alert(error.message || "Không xóa được sản phẩm!");
        }
    };

    const productModalElement = document.getElementById("addProductModal");
    const productModal = productModalElement ? bootstrap.Modal.getOrCreateInstance(productModalElement) : null;

    function populateBrandSelect(selectedSlug) {
        const select = document.getElementById("new-brand");
        if (!select) return;
        const selected = selectedSlug || select.value;
        select.innerHTML = brands.length
            ? brands.map((brand) => `<option value="${escapeHtml(brand.slug)}">${escapeHtml(brand.name)}</option>`).join("")
            : '<option value="">Chưa có thương hiệu</option>';
        if (selected && brands.some((brand) => brand.slug === selected)) select.value = selected;
    }

    function populateCategorySelect(selectedSlug) {
        const select = document.getElementById("new-type");
        if (!select) return;
        const selected = selectedSlug || select.value;
        select.innerHTML = categories.length
            ? categories.map((category) => `<option value="${escapeHtml(category.slug)}">${escapeHtml(category.name)}</option>`).join("")
            : '<option value="">Chưa có danh mục</option>';
        if (selected && categories.some((category) => category.slug === selected)) select.value = selected;
    }

    function setSizeFields(sizes = []) {
        [50, 75, 100].forEach((ml) => {
            const size = sizes.find((item) => Number(item.ml) === ml);
            document.getElementById(`price-${ml}`).value = size ? size.price : "";
            document.getElementById(`stock-${ml}`).value = size ? size.stock : "";
        });
    }

    function resetProductForm() {
        document.getElementById("form-add-product")?.reset();
        document.getElementById("edit-product-id").value = "";
        document.getElementById("preview-img").src = "https://via.placeholder.com/150";
        document.getElementById("new-discount").value = "0";
        document.getElementById("new-isNew").value = "false";
        document.getElementById("new-isFeatured").value = "false";
        populateBrandSelect();
        populateCategorySelect();
        setSizeFields([]);
    }

    document.getElementById("btn-add-product")?.addEventListener("click", function () {
        if (!brands.length) {
            alert("Hãy thêm ít nhất một thương hiệu trước khi thêm sản phẩm.");
            window.navigateTo("thuong-hieu");
            return;
        }
        if (!categories.length) {
            alert("Hãy thêm ít nhất một danh mục trước khi thêm sản phẩm.");
            window.navigateTo("danh-muc");
            return;
        }
        resetProductForm();
        productModal?.show();
    });

    window.editProduct = function (id) {
        const product = products.find((item) => String(item.id) === String(id));
        if (!product) return;
        resetProductForm();
        document.getElementById("edit-product-id").value = product.id;
        document.getElementById("new-name").value = product.name || "";
        populateBrandSelect(product.brand);
        populateCategorySelect(product.type);
        document.getElementById("new-type").value = product.type || categories[0]?.slug || "";
        document.getElementById("new-image-path").value = product.image || "";
        document.getElementById("preview-img").src = product.image || "https://via.placeholder.com/150";
        document.getElementById("new-short").value = product.short || product.shortDesc || "";
        document.getElementById("new-discount").value = Number(product.discount || 0);
        document.getElementById("new-isNew").value = product.isNew ? "true" : "false";
        document.getElementById("new-isFeatured").value = product.isFeatured ? "true" : "false";
        setSizeFields(product.sizes || []);
        productModal?.show();
    };

    document.getElementById("btn-save-new-product")?.addEventListener("click", async function () {
        const editingId = document.getElementById("edit-product-id").value;
        const sizes = [50, 75, 100].map((ml) => ({
            ml,
            price: Number(document.getElementById(`price-${ml}`).value),
            stock: Number(document.getElementById(`stock-${ml}`).value || 0)
        })).filter((size) => size.price > 0);

        const payload = {
            code: editingId || undefined,
            name: document.getElementById("new-name").value.trim(),
            brand: document.getElementById("new-brand").value,
            type: document.getElementById("new-type").value,
            image: document.getElementById("new-image-path").value.trim(),
            shortDesc: document.getElementById("new-short").value.trim(),
            discount: Number(document.getElementById("new-discount").value || 0),
            isNew: document.getElementById("new-isNew").value === "true",
            isFeatured: document.getElementById("new-isFeatured").value === "true",
            sizes
        };

        try {
            if (editingId) await apiPut(`/products/${editingId}`, payload);
            else await apiPost("/products", payload);
            [products, reportData] = await Promise.all([apiGet("/products"), apiGet("/reports/dashboard")]);
            showProduct();
            renderOverview();
            productModal?.hide();
            alert(editingId ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!");
        } catch (error) {
            alert(error.message || "Không lưu được sản phẩm.");
        }
    });

    function findOrder() {
        const el = document.getElementById("showOrder");
        if (!el) return;
        if (!orders.length) {
            el.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có đơn hàng nào.</td></tr>';
            return;
        }

        el.innerHTML = orders.map((order) => `
            <tr>
                <td>#${order.id}</td>
                <td><div class="fw-bold">${escapeHtml(order.customerName || "Khách hàng")}</div><div class="small text-muted">${escapeHtml(order.phone || "")}</div></td>
                <td>${escapeHtml(order.date || "")}</td>
                <td>${formatVND(order.total)}</td>
                <td><span class="badge bg-primary">${escapeHtml(order.status || "Chờ xác nhận")}</span></td>
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
            </tr>`).join("");
    }

    window.updateOrderStatus = async function (id, status) {
        if (!status) return;
        try {
            await apiPatch("/orders/" + id + "/status", { status });
            await refreshOrdersAndReports({ silent: false });
        } catch (error) {
            alert(error.message || "Không cập nhật được trạng thái đơn hàng.");
        }
    };

    function showUser() {
        const el = document.getElementById("show-user");
        if (!el) return;
        const customers = users.filter((user) => user.role !== "admin");
        if (!customers.length) {
            el.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có khách hàng nào.</td></tr>';
            return;
        }

        el.innerHTML = customers.map((u, index) => `
            <tr>
                <td>${index + 1}</td>
                <td class="fw-bold">${escapeHtml(u.fullName)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(u.createdAt || "")}</td>
                <td><span class="badge bg-success">Active</span></td>
                <td class="text-center"><button class="btn btn-sm btn-light" disabled><i class="bi bi-person"></i></button></td>
            </tr>`).join("");
    }

    function renderBrands() {
        const el = document.getElementById("show-brand");
        if (!el) return;
        if (!brands.length) {
            el.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Chưa có thương hiệu. Nhấn “Thêm Hãng” để tạo mới.</td></tr>';
            return;
        }

        el.innerHTML = brands.map((brand) => {
            const logo = String(brand.logo || "").trim();
            const logoHtml = logo
                ? `<img src="${escapeHtml(logo)}" class="brand-logo-thumb" alt="${escapeHtml(brand.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'"><span class="brand-logo-fallback" style="display:none">${escapeHtml(brand.name.charAt(0).toUpperCase())}</span>`
                : `<span class="brand-logo-fallback">${escapeHtml(brand.name.charAt(0).toUpperCase())}</span>`;
            return `
            <tr>
                <td>${logoHtml}</td>
                <td><div class="fw-bold">${escapeHtml(brand.name)}</div><small class="text-muted">${escapeHtml(brand.slug)}</small></td>
                <td>${escapeHtml(brand.description || "Chưa có mô tả")}<div class="small text-muted">${brand.productCount} sản phẩm</div></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary me-1" onclick="window.editBrand(${brand.id})"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="window.deleteBrand(${brand.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join("");
    }

    const genericModalElement = document.getElementById("genericEditModal");
    const genericModal = genericModalElement ? bootstrap.Modal.getOrCreateInstance(genericModalElement) : null;
    const logoUrlInput = document.getElementById("generic-logo-url");
    const logoFileInput = document.getElementById("generic-logo-file");
    const logoDataInput = document.getElementById("generic-logo-data");
    const logoPreview = document.getElementById("generic-logo-preview");
    const logoPlaceholder = document.getElementById("generic-logo-placeholder");

    function showLogoPreview(value) {
        const source = String(value || "").trim();
        if (!logoPreview || !logoPlaceholder) return;
        if (!source) {
            logoPreview.removeAttribute("src");
            logoPreview.style.display = "none";
            logoPlaceholder.style.display = "inline";
            return;
        }
        logoPreview.src = source;
        logoPreview.style.display = "block";
        logoPlaceholder.style.display = "none";
    }

    function resetGenericForm(type) {
        document.getElementById("generic-id").value = "";
        document.getElementById("generic-type").value = type;
        document.getElementById("generic-name").value = "";
        document.getElementById("generic-desc").value = "";
        document.getElementById("brand-logo-fields").style.display = type === "brand" ? "block" : "none";
        if (logoUrlInput) logoUrlInput.value = "";
        if (logoFileInput) logoFileInput.value = "";
        if (logoDataInput) logoDataInput.value = "";
        showLogoPreview("");
    }

    logoUrlInput?.addEventListener("input", function () {
        if (logoDataInput) logoDataInput.value = "";
        showLogoPreview(this.value);
    });

    document.getElementById("btn-clear-brand-logo")?.addEventListener("click", function () {
        if (logoUrlInput) logoUrlInput.value = "";
        if (logoFileInput) logoFileInput.value = "";
        if (logoDataInput) logoDataInput.value = "";
        showLogoPreview("");
    });

    logoFileInput?.addEventListener("change", function () {
        const file = this.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn đúng file ảnh.");
            this.value = "";
            return;
        }
        if (file.size > 1024 * 1024) {
            alert("Logo tối đa 1 MB. Hãy nén ảnh rồi chọn lại.");
            this.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = String(reader.result || "");
            if (logoDataInput) logoDataInput.value = dataUrl;
            if (logoUrlInput) logoUrlInput.value = "";
            showLogoPreview(dataUrl);
        };
        reader.readAsDataURL(file);
    });

    window.addNewBrand = function () {
        resetGenericForm("brand");
        document.getElementById("generic-modal-title").textContent = "Thêm thương hiệu";
        genericModal?.show();
    };

    window.editBrand = function (id) {
        const brand = brands.find((item) => Number(item.id) === Number(id));
        if (!brand) return;
        resetGenericForm("brand");
        document.getElementById("generic-modal-title").textContent = "Cập nhật thương hiệu";
        document.getElementById("generic-id").value = brand.id;
        document.getElementById("generic-name").value = brand.name || "";
        document.getElementById("generic-desc").value = brand.description || "";
        if (logoUrlInput && !String(brand.logo || "").startsWith("data:")) logoUrlInput.value = brand.logo || "";
        if (logoDataInput && String(brand.logo || "").startsWith("data:")) logoDataInput.value = brand.logo;
        showLogoPreview(brand.logo || "");
        genericModal?.show();
    };

    window.deleteBrand = async function (id) {
        if (!confirm("Bạn có chắc muốn xóa thương hiệu này?")) return;
        try {
            await apiDelete(`/brands/${id}`);
            brands = await apiGet("/brands");
            renderBrands();
            populateBrandSelect();
            alert("Xóa thương hiệu thành công!");
        } catch (error) {
            alert(error.message || "Không xóa được thương hiệu.");
        }
    };

    function renderCategories() {
        const el = document.getElementById("show-category");
        if (!el) return;
        if (!categories.length) {
            el.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Chưa có danh mục. Nhấn “Thêm Mục” để tạo mới.</td></tr>';
            return;
        }
        el.innerHTML = categories.map((category) => `
            <tr>
                <td><span class="badge bg-light text-dark">${escapeHtml(category.slug)}</span></td>
                <td><div class="fw-bold">${escapeHtml(category.name)}</div><small class="text-muted">${category.productCount} sản phẩm</small></td>
                <td>${escapeHtml(category.description || "Chưa có mô tả")}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary me-1" onclick="window.editCategory(${category.id})"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="window.deleteCategory(${category.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`).join("");
    }

    window.addNewCategory = function () {
        resetGenericForm("category");
        document.getElementById("generic-modal-title").textContent = "Thêm danh mục";
        genericModal?.show();
    };

    window.editCategory = function (id) {
        const category = categories.find((item) => Number(item.id) === Number(id));
        if (!category) return;
        resetGenericForm("category");
        document.getElementById("generic-modal-title").textContent = "Cập nhật danh mục";
        document.getElementById("generic-id").value = category.id;
        document.getElementById("generic-name").value = category.name || "";
        document.getElementById("generic-desc").value = category.description || "";
        genericModal?.show();
    };

    window.deleteCategory = async function (id) {
        if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
        try {
            await apiDelete(`/categories/${id}`);
            categories = await apiGet("/categories");
            renderCategories();
            populateCategorySelect();
            alert("Xóa danh mục thành công!");
        } catch (error) {
            alert(error.message || "Không xóa được danh mục.");
        }
    };

    document.getElementById("btn-save-generic")?.addEventListener("click", async function () {
        const type = document.getElementById("generic-type").value;
        const id = document.getElementById("generic-id").value;
        const payload = {
            name: document.getElementById("generic-name").value.trim(),
            description: document.getElementById("generic-desc").value.trim()
        };

        try {
            if (type === "brand") {
                payload.logo = logoDataInput?.value || logoUrlInput?.value.trim() || "";
                if (id) await apiPut(`/brands/${id}`, payload);
                else await apiPost("/brands", payload);
                brands = await apiGet("/brands");
                renderBrands();
                populateBrandSelect();
            } else if (type === "category") {
                if (id) await apiPut(`/categories/${id}`, payload);
                else await apiPost("/categories", payload);
                categories = await apiGet("/categories");
                renderCategories();
                populateCategorySelect();
            } else {
                return;
            }
            genericModal?.hide();
            alert(id ? "Cập nhật thành công!" : "Thêm mới thành công!");
        } catch (error) {
            alert(error.message || "Không lưu được dữ liệu.");
        }
    });

    function renderReports() {
        if (!reportData) return;
        renderBrandReport();
        renderCategoryReport();
        renderTopProducts();
        renderLowStock();
    }

    function renderBrandReport() {
        const canvas = document.getElementById("brandChart");
        if (!canvas || !window.Chart) return;
        destroyChart("brand");
        const rows = reportData.orderValueByBrand || [];
        charts.brand = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: rows.map((row) => row.brandName),
                datasets: [{ label: "Giá trị đơn hàng (không gồm đơn hủy)", data: rows.map((row) => row.orderValue) }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                scales: { x: { beginAtZero: true } }
            }
        });
    }

    function renderCategoryReport() {
        const canvas = document.getElementById("categoryChart");
        if (!canvas || !window.Chart) return;
        destroyChart("category");
        const rows = reportData.categoryDistribution || [];
        charts.category = new Chart(canvas.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: rows.map((row) => row.categoryName || displayType(row.type)),
                datasets: [{ data: rows.map((row) => row.productCount) }]
            },
            options: { responsive: true }
        });
    }

    function renderTopProducts() {
        const el = document.getElementById("showTk");
        if (!el) return;
        const rows = reportData.topProducts || [];
        if (!rows.length) {
            el.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có dữ liệu bán hàng.</td></tr>';
            return;
        }
        el.innerHTML = rows.map((row, index) => `
            <tr>
                <td class="ps-4 fw-bold">${index + 1}</td>
                <td>${escapeHtml(row.name)}</td>
                <td class="text-center fw-bold">${row.quantitySold}</td>
                <td class="text-center">${row.totalStock}</td>
                <td class="text-end pe-4">${formatVND(row.orderValue)}</td>
            </tr>`).join("");
    }

    function renderLowStock() {
        const el = document.getElementById("low-stock-alert");
        if (!el) return;
        const rows = reportData.lowStock || [];
        if (!rows.length) {
            el.innerHTML = '<div class="text-success"><i class="bi bi-check-circle me-2"></i>Không có sản phẩm sắp hết hàng.</div>';
            return;
        }
        const grouped = new Map();
        rows.forEach((row) => {
            const key = String(row.id || row.dbId || row.name);
            if (!grouped.has(key)) grouped.set(key, { name: row.name, sizes: [] });
            grouped.get(key).sizes.push({ ml: row.ml, stock: row.stock });
        });

        el.innerHTML = Array.from(grouped.values()).map((product) => `
            <div class="low-stock-row">
                <div class="low-stock-name fw-bold mb-2" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</div>
                <div class="d-flex flex-wrap gap-1">
                    ${product.sizes.map((size) => `<span class="low-stock-size">${size.ml}ml: ${size.stock}</span>`).join("")}
                </div>
            </div>`).join("");
    }

    restoreAdminSession();
});
