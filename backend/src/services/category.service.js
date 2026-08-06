const categoryModel = require("../models/category.model");
const ApiError = require("../utils/ApiError");
const { requiredString, optionalString, positiveInteger } = require("../utils/validation");

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);
}

function normalizeCategory(payload) {
    const name = requiredString(payload.name, "Tên danh mục", 100);
    const slug = optionalString(payload.slug || slugify(name), 50) || slugify(name);
    if (!slug) throw new ApiError(400, "Không thể tạo mã danh mục từ tên đã nhập");

    return {
        name,
        slug,
        description: optionalString(payload.description || payload.desc, 255)
    };
}

async function listCategories() {
    return categoryModel.list();
}

async function createCategory(payload) {
    try {
        return await categoryModel.create(normalizeCategory(payload));
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            throw new ApiError(409, "Tên hoặc mã danh mục đã tồn tại");
        }
        throw error;
    }
}

async function updateCategory(id, payload) {
    try {
        const category = await categoryModel.update(
            positiveInteger(id, "Mã danh mục"),
            normalizeCategory(payload)
        );
        if (!category) throw new ApiError(404, "Không tìm thấy danh mục");
        return category;
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            throw new ApiError(409, "Tên hoặc mã danh mục đã tồn tại");
        }
        throw error;
    }
}

async function deleteCategory(id) {
    const result = await categoryModel.remove(positiveInteger(id, "Mã danh mục"));
    if (!result.found) throw new ApiError(404, "Không tìm thấy danh mục");
    if (result.inUse) throw new ApiError(409, "Không thể xóa danh mục đang được sản phẩm sử dụng");
}

module.exports = {
    slugify,
    normalizeCategory,
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
