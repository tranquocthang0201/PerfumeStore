const sql = require("mssql");
const { env } = require("./env");

const dbConfig = {
    user: env.db.user,
    password: env.db.password,
    server: env.db.server,
    port: env.db.port,
    database: env.db.database,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: env.db.encrypt,
        trustServerCertificate: env.db.trustServerCertificate,
        enableArithAbort: true
    }
};

let poolPromise;

function getPool() {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(dbConfig)
            .connect()
            .then((pool) => {
                console.log(`Đã kết nối SQL Server: ${env.db.server}/${env.db.database}`);
                pool.on("error", (error) => console.error("SQL pool error:", error));
                return pool;
            })
            .catch((error) => {
                poolPromise = undefined;
                throw error;
            });
    }

    return poolPromise;
}

async function closePool() {
    if (!poolPromise) return;
    const pool = await poolPromise.catch(() => null);
    poolPromise = undefined;
    if (pool) await pool.close();
}

module.exports = { sql, dbConfig, getPool, closePool };
