const openapi = require("./openapi");

function setupSwagger(app) {
    app.get("/api-docs.json", (req, res) => res.json(openapi));
    app.get("/api-docs", (req, res) => {
        res.type("html").send(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PerfumeStore API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => SwaggerUIBundle({
      url: '/api-docs.json', dom_id: '#swagger-ui', deepLinking: true,
      persistAuthorization: true, displayRequestDuration: true
    });
  </script>
</body>
</html>`);
    });
}

module.exports = { setupSwagger };
