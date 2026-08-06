const productService = require("../services/product.service");

async function list(req, res) {
    res.json(await productService.listProducts(req.query));
}

async function getById(req, res) {
    res.json(await productService.getProduct(req.params.id));
}

async function create(req, res) {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ message: "Thêm sản phẩm thành công", product });
}

async function update(req, res) {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({ message: "Cập nhật sản phẩm thành công", product });
}

async function remove(req, res) {
    await productService.deleteProduct(req.params.id);
    res.json({ message: "Xóa sản phẩm thành công" });
}

module.exports = { list, getById, create, update, remove };
