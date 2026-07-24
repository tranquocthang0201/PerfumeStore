const test = require("node:test");
const assert = require("node:assert/strict");
const openapi = require("../src/docs/openapi");

const expectedOperations = [
    ["/api/health", "get"],
    ["/api/auth/register", "post"],
    ["/api/auth/login", "post"],
    ["/api/auth/me", "get"],
    ["/api/products", "get"],
    ["/api/products", "post"],
    ["/api/products/{id}", "get"],
    ["/api/products/{id}", "put"],
    ["/api/products/{id}", "delete"],
    ["/api/brands", "get"],
    ["/api/brands", "post"],
    ["/api/brands/{id}", "put"],
    ["/api/brands/{id}", "delete"],
    ["/api/categories", "get"],
    ["/api/categories", "post"],
    ["/api/categories/{id}", "put"],
    ["/api/categories/{id}", "delete"],
    ["/api/reports/dashboard", "get"],
    ["/api/orders", "get"],
    ["/api/orders", "post"],
    ["/api/orders/my", "get"],
    ["/api/orders/{id}", "get"],
    ["/api/orders/{id}/status", "patch"],
    ["/api/orders/{id}/cancel", "patch"],
    ["/api/users", "get"],
    ["/api/users/me", "put"]
];

test("OpenAPI mô tả toàn bộ endpoint của dự án", () => {
    assert.equal(openapi.openapi, "3.0.3");
    for (const [path, method] of expectedOperations) {
        assert.ok(openapi.paths[path]?.[method], `Thiếu ${method.toUpperCase()} ${path}`);
        assert.ok(openapi.paths[path][method].responses, `Thiếu responses cho ${method.toUpperCase()} ${path}`);
    }
});

test("OpenAPI khai báo Bearer JWT", () => {
    const scheme = openapi.components.securitySchemes.bearerAuth;
    assert.equal(scheme.type, "http");
    assert.equal(scheme.scheme, "bearer");
    assert.equal(scheme.bearerFormat, "JWT");
});
