const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const sql = require("mssql");
const { env } = require("../config/env");
const { dbConfig, getPool, closePool } = require("../config/db");
const products = require("./products.json");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function connectWithRetry(config, retries = Number(process.env.DB_CONNECT_RETRIES || 60)) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            return await new sql.ConnectionPool(config).connect();
        } catch (error) {
            lastError = error;
            console.log(`Chờ SQL Server (${attempt}/${retries})...`);
            await sleep(2000);
        }
    }
    throw lastError;
}

async function ensureDatabase() {
    const masterConfig = { ...dbConfig, database: "master" };
    const master = await connectWithRetry(masterConfig);
    try {
        const safeDatabaseName = env.db.database.replace(/]/g, "]]" );
        await master.request()
            .input("database", sql.NVarChar(128), env.db.database)
            .query(`IF DB_ID(@database) IS NULL EXEC(N'CREATE DATABASE [${safeDatabaseName}]')`);
    } finally {
        await master.close();
    }
}

async function runSchema(pool) {
    const schemaPath = path.join(__dirname, "../../database/database.sql");
    const batches = fs.readFileSync(schemaPath, "utf8")
        .split(/^\s*GO\s*$/gim)
        .map((batch) => batch.trim())
        .filter(Boolean);

    for (const batch of batches) {
        await pool.request().batch(batch);
    }
}

async function seedAdmin(pool) {
    const passwordHash = await bcrypt.hash(env.admin.password, 12);
    await pool.request()
        .input("email", sql.NVarChar(100), env.admin.email.toLowerCase())
        .input("fullName", sql.NVarChar(100), env.admin.fullName)
        .input("password", sql.NVarChar(255), passwordHash)
        .query(`
            MERGE Users AS target
            USING (SELECT @email AS email) AS source
            ON target.email = source.email
            WHEN MATCHED THEN
                UPDATE SET fullName = @fullName, password = @password, role = N'admin'
            WHEN NOT MATCHED THEN
                INSERT (fullName, email, password, phone, address, role)
                VALUES (@fullName, @email, @password, N'', N'PerfumeStore', N'admin');
        `);
}

function displayBrandName(slug) {
    const known = {
        ck: "Calvin Klein",
        dg: "Dolce & Gabbana",
        tomford: "Tom Ford",
        ysl: "Yves Saint Laurent"
    };
    if (known[slug]) return known[slug];
    return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

async function seedBrands(pool) {
    const slugs = [...new Set(products.map((product) => String(product.brand || "").trim().toLowerCase()).filter(Boolean))];
    for (const slug of slugs) {
        await pool.request()
            .input("name", sql.NVarChar(100), displayBrandName(slug))
            .input("slug", sql.NVarChar(50), slug)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Brands WHERE slug = @slug)
                    INSERT INTO Brands (name, slug, description, logo)
                    VALUES (@name, @slug, N'', N'')
            `);
    }

    await pool.request().query(`
        INSERT INTO Brands (name, slug, description, logo)
        SELECT UPPER(LEFT(p.brand, 1)) + SUBSTRING(p.brand, 2, 99), p.brand, N'', N''
        FROM Products p
        WHERE NOT EXISTS (SELECT 1 FROM Brands b WHERE b.slug = p.brand)
        GROUP BY p.brand
    `);

    const knownLogos = {
        chanel: "pic/chanelthuonghieu.jpg",
        dior: "pic/diorthuonghieu.jpg",
        gucci: "pic/thuonghieugucci.jpg",
        versace: "pic/thuonghieuversace.jpg",
        tomford: "pic/thuonghieutomford.jpg",
        ysl: "pic/thuonghieuysl.jpg",
        ck: "pic/thuonghieuCK.jpg",
        creed: "pic/thuonghieucreed.jpg",
        armani: "pic/thuonghieuarmani.jpg",
        dg: "pic/thuonghieudg.jpg"
    };
    for (const [slug, logo] of Object.entries(knownLogos)) {
        await pool.request()
            .input("slug", sql.NVarChar(50), slug)
            .input("logo", sql.NVarChar(sql.MAX), logo)
            .query("UPDATE Brands SET logo = @logo WHERE slug = @slug AND (logo IS NULL OR logo = N'')");
    }
}

async function seedCategories(pool) {
    const defaults = [
        { name: "Nước hoa Nam", slug: "nam", description: "Dành cho phái mạnh" },
        { name: "Nước hoa Nữ", slug: "nu", description: "Dành cho phái đẹp" },
        { name: "Nước hoa Unisex", slug: "unisex", description: "Phi giới tính" }
    ];

    for (const category of defaults) {
        await pool.request()
            .input("name", sql.NVarChar(100), category.name)
            .input("slug", sql.NVarChar(50), category.slug)
            .input("description", sql.NVarChar(255), category.description)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Categories WHERE slug = @slug)
                    INSERT INTO Categories (name, slug, description)
                    VALUES (@name, @slug, @description)
            `);
    }

    await pool.request().query(`
        INSERT INTO Categories (name, slug, description)
        SELECT UPPER(LEFT(p.type, 1)) + SUBSTRING(p.type, 2, 99), p.type, N''
        FROM Products p
        WHERE NOT EXISTS (SELECT 1 FROM Categories c WHERE c.slug = p.type)
        GROUP BY p.type
    `);
}

async function seedProducts(pool) {
    for (const product of products) {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const existing = await new sql.Request(transaction)
                .input("code", sql.NVarChar(50), product.id)
                .query("SELECT TOP 1 id FROM Products WHERE code = @code");

            let productId = existing.recordset[0]?.id;
            if (!productId) {
                const inserted = await new sql.Request(transaction)
                    .input("code", sql.NVarChar(50), product.id)
                    .input("name", sql.NVarChar(150), product.name)
                    .input("image", sql.NVarChar(255), product.image)
                    .input("shortDesc", sql.NVarChar(255), product.short)
                    .input("type", sql.NVarChar(50), product.type)
                    .input("brand", sql.NVarChar(50), product.brand)
                    .input("discount", sql.Int, Number(product.discount || 0))
                    .input("isNew", sql.Bit, Boolean(product.isNew))
                    .input("isFeatured", sql.Bit, Boolean(product.isFeatured))
                    .query(`
                        INSERT INTO Products (code, name, image, shortDesc, type, brand, discount, isNew, isFeatured)
                        OUTPUT INSERTED.id
                        VALUES (@code, @name, @image, @shortDesc, @type, @brand, @discount, @isNew, @isFeatured)
                    `);
                productId = inserted.recordset[0].id;
            }

            for (const size of product.sizes) {
                await new sql.Request(transaction)
                    .input("productId", sql.Int, productId)
                    .input("ml", sql.Int, size.ml)
                    .input("price", sql.Decimal(18, 2), size.price)
                    .input("stock", sql.Int, size.stock)
                    .query(`
                        IF NOT EXISTS (SELECT 1 FROM ProductSizes WHERE productId = @productId AND ml = @ml)
                            INSERT INTO ProductSizes (productId, ml, price, stock)
                            VALUES (@productId, @ml, @price, @stock)
                    `);
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

async function main() {
    await ensureDatabase();
    const pool = await getPool();
    await runSchema(pool);
    await seedAdmin(pool);
    await seedProducts(pool);
    await seedBrands(pool);
    await seedCategories(pool);
    console.log(`Database ${env.db.database} đã sẵn sàng với ${products.length} sản phẩm.`);
    await closePool();
}

main().catch(async (error) => {
    console.error("Khởi tạo database thất bại:", error);
    await closePool();
    process.exit(1);
});
