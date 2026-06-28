const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

if (process.env.DB_INSTANCE) {
    dbConfig.options.instanceName = process.env.DB_INSTANCE;
}

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log("Kết nối SQL Server thành công");
        return pool;
    })
    .catch(err => {
        console.error("Lỗi kết nối SQL Server:", err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};