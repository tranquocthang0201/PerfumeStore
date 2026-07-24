const test = require("node:test");
const assert = require("node:assert/strict");
const { slugify, normalizeProduct } = require("../src/services/product.service");

test("slugify tạo mã sản phẩm ổn định từ tiếng Việt", () => {
    assert.equal(slugify("Nước Hoa Nữ Cao Cấp"), "nuoc-hoa-nu-cao-cap");
});

test("normalizeProduct chuẩn hóa dữ liệu sản phẩm", () => {
    const product = normalizeProduct({
        name: " Chanel Chance ",
        image: "pic/chanelchance.jpg",
        short: "Hoa cỏ thanh lịch",
        type: "NU",
        brand: "CHANEL",
        discount: "25",
        isNew: "true",
        isFeatured: false,
        sizes: [
            { ml: 50, price: 2500000, stock: 5 },
            { ml: 100, price: 3900000, stock: 2 }
        ]
    });

    assert.equal(product.code, "chanel-chance");
    assert.equal(product.type, "nu");
    assert.equal(product.brand, "chanel");
    assert.equal(product.discount, 25);
    assert.equal(product.isNew, true);
    assert.equal(product.isFeatured, false);
    assert.equal(product.sizes.length, 2);
});

test("normalizeProduct từ chối dung tích trùng", () => {
    assert.throws(() => normalizeProduct({
        name: "Test",
        type: "nam",
        brand: "test",
        sizes: [
            { ml: 50, price: 100, stock: 1 },
            { ml: 50, price: 200, stock: 1 }
        ]
    }), /Dung tích không được trùng nhau/);
});


test("normalizeProduct từ chối giảm giá vượt quá 99%", () => {
    assert.throws(() => normalizeProduct({
        name: "Test sale",
        type: "nam",
        brand: "test",
        discount: 100,
        sizes: [{ ml: 50, price: 1000000, stock: 1 }]
    }), /0 đến 99/);
});
