const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { env } = require("../src/config/env");
const { verifyToken, requireAdmin } = require("../src/middleware/authMiddleware");

function responseRecorder() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
}

test("verifyToken chấp nhận Bearer JWT hợp lệ", () => {
    const token = jwt.sign({ id: 7, role: "user" }, env.jwtSecret, { algorithm: "HS256" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = responseRecorder();
    let nextCalled = false;

    verifyToken(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 7);
});

test("verifyToken từ chối request thiếu token", () => {
    const req = { headers: {} };
    const res = responseRecorder();
    verifyToken(req, res, () => assert.fail("Không được gọi next"));
    assert.equal(res.statusCode, 401);
});

test("requireAdmin phân quyền theo role", () => {
    const forbidden = responseRecorder();
    requireAdmin({ user: { role: "user" } }, forbidden, () => assert.fail("Không được gọi next"));
    assert.equal(forbidden.statusCode, 403);

    let nextCalled = false;
    requireAdmin({ user: { role: "admin" } }, responseRecorder(), () => { nextCalled = true; });
    assert.equal(nextCalled, true);
});
