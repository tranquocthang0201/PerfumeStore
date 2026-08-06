const categoryService = require("../services/category.service");

async function list(req, res) {
    res.json(await categoryService.listCategories());
}

async function create(req, res) {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ message: "Thêm danh mục thành công", category });
}

async function update(req, res) {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.json({ message: "Cập nhật danh mục thành công", category });
}

async function remove(req, res) {
    await categoryService.deleteCategory(req.params.id);
    res.json({ message: "Xóa danh mục thành công" });
}

module.exports = { list, create, update, remove };
