const brandModel = require("../models/brand.model");
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

function normalizeBrand(payload) {
    const name = requiredString(payload.name, "Tên thương hiệu", 100);
    const slug = optionalString(payload.slug || slugify(name), 50) || slugify(name);
    if (!slug) throw new ApiError(400, "Không thể tạo mã thương hiệu từ tên đã nhập");

    return {
        name,
        slug,
        description: optionalString(payload.description || payload.desc, 255),
        logo: optionalString(payload.logo, 2_000_000)
    };
}

async function listBrands() {
    return brandModel.list();
}

async function createBrand(payload) {
    try {
        return await brandModel.create(normalizeBrand(payload));
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            throw new ApiError(409, "Tên hoặc mã thương hiệu đã tồn tại");
        }
        throw error;
    }
}

async function updateBrand(id, payload) {
    try {
        const brand = await brandModel.update(positiveInteger(id, "Mã thương hiệu"), normalizeBrand(payload));
        if (!brand) throw new ApiError(404, "Không tìm thấy thương hiệu");
        return brand;
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            throw new ApiError(409, "Tên hoặc mã thương hiệu đã tồn tại");
        }
        throw error;
    }
}

async function deleteBrand(id) {
    const result = await brandModel.remove(positiveInteger(id, "Mã thương hiệu"));
    if (!result.found) throw new ApiError(404, "Không tìm thấy thương hiệu");
    if (result.inUse) {
        throw new ApiError(409, "Không thể xóa thương hiệu đang được sản phẩm sử dụng");
    }
}

module.exports = { slugify, normalizeBrand, listBrands, createBrand, updateBrand, deleteBrand };
