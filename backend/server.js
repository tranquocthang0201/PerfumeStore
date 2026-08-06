const app = require("./src/app");
const { env } = require("./src/config/env");
const { closePool } = require("./src/config/db");

const server = app.listen(env.port, () => {
    console.log(`PerfumeStore API đang chạy tại http://localhost:${env.port}`);
    console.log(`Swagger UI: http://localhost:${env.port}/api-docs`);
});

async function shutdown(signal) {
    console.log(`\nNhận ${signal}, đang dừng server...`);
    server.close(async () => {
        await closePool();
        process.exit(0);
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
