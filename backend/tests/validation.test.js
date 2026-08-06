const test = require("node:test");
const assert = require("node:assert/strict");
const {
    requiredString,
    normalizeEmail,
    normalizePassword,
    positiveInteger,
    nonNegativeNumber
} = require("../src/utils/validation");

test("requiredString chuẩn hóa khoảng trắng", () => {
    assert.equal(requiredString("  Dior Sauvage  ", "Tên"), "Dior Sauvage");
});

test("normalizeEmail chuyển email về chữ thường", () => {
    assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
});

test("normalizeEmail từ chối định dạng sai", () => {
    assert.throws(() => normalizeEmail("khong-hop-le"), /Email không hợp lệ/);
});

test("normalizePassword yêu cầu tối thiểu 8 ký tự", () => {
    assert.throws(() => normalizePassword("1234567"), /ít nhất 8 ký tự/);
    assert.equal(normalizePassword("12345678"), "12345678");
});

test("positiveInteger và nonNegativeNumber kiểm tra dữ liệu số", () => {
    assert.equal(positiveInteger("3", "Số lượng"), 3);
    assert.equal(nonNegativeNumber("2500000", "Giá"), 2500000);
    assert.throws(() => positiveInteger(0, "Số lượng"), /số nguyên dương/);
    assert.throws(() => nonNegativeNumber(-1, "Giá"), /số không âm/);
});
