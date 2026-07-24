const test = require("node:test");
const assert = require("node:assert/strict");
const { slugify, normalizeCategory } = require("../src/services/category.service");

test("slugify danh mục hỗ trợ tiếng Việt", () => {
    assert.equal(slugify("  Nước Hoa Mini  "), "nuoc-hoa-mini");
});

test("normalizeCategory chuẩn hóa dữ liệu", () => {
    const category = normalizeCategory({
        name: "  Nước hoa Mini ",
        description: "  Chai dung tích nhỏ  "
    });
    assert.equal(category.name, "Nước hoa Mini");
    assert.equal(category.slug, "nuoc-hoa-mini");
    assert.equal(category.description, "Chai dung tích nhỏ");
});
