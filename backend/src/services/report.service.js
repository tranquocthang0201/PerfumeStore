const reportModel = require("../models/report.model");

async function getDashboardReport() {
    return reportModel.getDashboardReport();
}

module.exports = { getDashboardReport };
