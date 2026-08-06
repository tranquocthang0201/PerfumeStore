const API_URL = window.PERFUME_API_URL || (window.location.protocol === "file:" ? "http://localhost:3000/api" : "/api");

function getToken() {
    return localStorage.getItem("token") || "";
}

async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(API_URL + path, { ...options, headers });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
        if (response.status === 401 && token) {
            localStorage.removeItem("token");
            localStorage.removeItem("isAdmin");
        }
        const message = typeof payload === "object" && payload?.message
            ? payload.message
            : `API trả về lỗi ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

function apiGet(path) {
    return apiRequest(path);
}

function apiPost(path, data) {
    return apiRequest(path, { method: "POST", body: JSON.stringify(data) });
}

function apiPut(path, data) {
    return apiRequest(path, { method: "PUT", body: JSON.stringify(data) });
}

function apiPatch(path, data = {}) {
    return apiRequest(path, { method: "PATCH", body: JSON.stringify(data) });
}

function apiDelete(path) {
    return apiRequest(path, { method: "DELETE" });
}
