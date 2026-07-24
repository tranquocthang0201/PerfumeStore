require("dotenv").config();

function numberFromEnv(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: numberFromEnv(process.env.PORT, 3000),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:8080",
    jwtSecret: process.env.JWT_SECRET || "change-this-secret-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    db: {
        user: process.env.DB_USER || "sa",
        password: process.env.DB_PASSWORD || "YourStrong!Passw0rd",
        server: process.env.DB_SERVER || "127.0.0.1",
        port: numberFromEnv(process.env.DB_PORT, 1433),
        database: process.env.DB_DATABASE || "PerfumeStoreDB",
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false"
    },
    admin: {
        email: process.env.ADMIN_EMAIL || "admin@perfume.vn",
        password: process.env.ADMIN_PASSWORD || "Admin@123",
        fullName: process.env.ADMIN_FULL_NAME || "PerfumeStore Admin"
    }
};

const weakJwtSecrets = new Set([
    "change-this-secret-in-production",
    "replace-this-with-a-long-random-secret"
]);

if (env.nodeEnv === "production" && weakJwtSecrets.has(env.jwtSecret)) {
    throw new Error("JWT_SECRET mạnh bắt buộc phải được cấu hình trong môi trường production");
}

module.exports = { env };
