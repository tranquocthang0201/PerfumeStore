const productModel = require("../models/product.model");
const brandModel = require("../models/brand.model");
const categoryModel = require("../models/category.model");
const ApiError = require("../utils/ApiError");
const {
    requiredString,
    optionalString,
    positiveInteger,
    nonNegativeNumber
} = require("../utils/validation");

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);
}

function normalizeBoolean(value) {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value === undefined || value === null || value === "") return false;
    const normalized = String(value).trim().toLowerCase();
    if (["true", "1", "yes", "co", "có"].includes(normalized)) return true;
    if (["false", "0", "no", "khong", "không"].includes(normalized)) return false;
    throw new ApiError(400, "Giá trị Có/Không không hợp lệ");
}

function normalizeProduct(payload) {
    const name = requiredString(payload.name, "Tên sản phẩm", 150);
    const code = optionalString(payload.code || payload.id || slugify(name), 50) || slugify(name);
    const image = optionalString(payload.image, 255);
    const shortDesc = optionalString(payload.shortDesc || payload.short, 255);
    const type = requiredString(payload.type, "Loại sản phẩm", 50).toLowerCase();
    const brand = requiredString(payload.brand, "Thương hiệu", 50).toLowerCase();
    const discount = nonNegativeNumber(payload.discount ?? 0, "Giảm giá");
    if (!Number.isInteger(discount) || discount > 99) {
        throw new ApiError(400, "Giảm giá phải là số nguyên từ 0 đến 99");
    }
    const isNew = normalizeBoolean(payload.isNew);
    const isFeatured = normalizeBoolean(payload.isFeatured);

    if (!Array.isArray(payload.sizes) || payload.sizes.length === 0) {
        throw new ApiError(400, "Sản phẩm phải có ít nhất một dung tích");
    }

    const sizes = payload.sizes.map((size) => ({
        ml: positiveInteger(size.ml, "Dung tích"),
        price: nonNegativeNumber(size.price, "Giá"),
        stock: positiveInteger(size.stock, "Tồn kho", { allowZero: true })
    }));

    if (sizes.some((size) => size.price <= 0)) throw new ApiError(400, "Giá phải lớn hơn 0");
    if (new Set(sizes.map((size) => size.ml)).size !== sizes.length) {
        throw new ApiError(400, "Dung tích không được trùng nhau");
    }

    return { code, name, image, shortDesc, type, brand, discount, isNew, isFeatured, sizes };
}

async function listProducts(query) {
    return productModel.list({
        brand: optionalString(query.brand, 50).toLowerCase() || undefined,
        type: optionalString(query.type, 50).toLowerCase() || undefined,
        search: optionalString(query.search, 150) || undefined
    });
}

async function getProduct(identifier) {
    const product = await productModel.findByIdentifier(identifier);
    if (!product) throw new ApiError(404, "Không tìm thấy sản phẩm");
    return product;
}

async function createProduct(payload) {
    try {
        const product = normalizeProduct(payload);
        if (!await brandModel.findBySlug(product.brand)) {
            throw new ApiError(400, "Thương hiệu chưa tồn tại. Hãy thêm thương hiệu trước.");
        }
        if (!await categoryModel.findBySlug(product.type)) {
            throw new ApiError(400, "Danh mục chưa tồn tại. Hãy thêm danh mục trước.");
        }
        return await productModel.create(product);
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) throw new ApiError(409, "Mã sản phẩm đã tồn tại");
        throw error;
    }
}

async function updateProduct(identifier, payload) {
    try {
        const normalized = normalizeProduct(payload);
        if (!await brandModel.findBySlug(normalized.brand)) {
            throw new ApiError(400, "Thương hiệu chưa tồn tại. Hãy thêm thương hiệu trước.");
        }
        if (!await categoryModel.findBySlug(normalized.type)) {
            throw new ApiError(400, "Danh mục chưa tồn tại. Hãy thêm danh mục trước.");
        }
        const product = await productModel.update(identifier, normalized);
        if (!product) throw new ApiError(404, "Không tìm thấy sản phẩm");
        return product;
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) throw new ApiError(409, "Mã sản phẩm đã tồn tại");
        throw error;
    }
}

async function deleteProduct(identifier) {
    const deleted = await productModel.remove(identifier);
    if (!deleted) throw new ApiError(404, "Không tìm thấy sản phẩm");
}

module.exports = {
    slugify,
    normalizeBoolean,
    normalizeProduct,
    listProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};
