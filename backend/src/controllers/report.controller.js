const reportService = require("../services/report.service");

async function dashboard(req, res) {
    res.json(await reportService.getDashboardReport());
}

module.exports = { dashboard };
