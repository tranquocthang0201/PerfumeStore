const test = require("node:test");
const assert = require("node:assert/strict");
const { slugify, normalizeBrand } = require("../src/services/brand.service");

test("slugify thương hiệu hỗ trợ tiếng Việt và khoảng trắng", () => {
    assert.equal(slugify("  Thương Hiệu Mới  "), "thuong-hieu-moi");
});

test("normalizeBrand tạo slug và chuẩn hóa mô tả", () => {
    const brand = normalizeBrand({
        name: "  Maison Francis Kurkdjian ",
        description: "  Nước hoa niche cao cấp  "
    });
    assert.equal(brand.name, "Maison Francis Kurkdjian");
    assert.equal(brand.slug, "maison-francis-kurkdjian");
    assert.equal(brand.description, "Nước hoa niche cao cấp");
});
