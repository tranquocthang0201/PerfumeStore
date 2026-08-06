const brandService = require("../services/brand.service");

async function list(req, res) {
    res.json(await brandService.listBrands());
}

async function create(req, res) {
    const brand = await brandService.createBrand(req.body);
    res.status(201).json({ message: "Thêm thương hiệu thành công", brand });
}

async function update(req, res) {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    res.json({ message: "Cập nhật thương hiệu thành công", brand });
}

async function remove(req, res) {
    await brandService.deleteBrand(req.params.id);
    res.json({ message: "Xóa thương hiệu thành công" });
}

module.exports = { list, create, update, remove };
