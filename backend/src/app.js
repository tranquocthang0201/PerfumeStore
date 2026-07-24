const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const userRoutes = require("./routes/user.routes");
const healthRoutes = require("./routes/health.routes");
const brandRoutes = require("./routes/brand.routes");
const categoryRoutes = require("./routes/category.routes");
const reportRoutes = require("./routes/report.routes");
const { setupSwagger } = require("./docs/swagger");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.disable("x-powered-by");
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
});
app.use(cors({
    origin(origin, callback) {
        const allowed = env.corsOrigin.split(",").map((item) => item.trim());
        if (!origin || allowed.includes("*") || allowed.includes(origin)) return callback(null, true);
        return callback(new Error("Origin không được CORS cho phép"));
    },
    credentials: false
}));
app.use(express.json({ limit: "4mb" }));

app.get("/", (req, res) => {
    res.json({ name: "PerfumeStore API", version: "2.2.0", docs: "/api-docs" });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
setupSwagger(app);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
