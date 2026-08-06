const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "../..");
const targets = [
    path.join(projectRoot, "backend", "server.js"),
    path.join(projectRoot, "backend", "src"),
    path.join(projectRoot, "backend", "scripts"),
    path.join(projectRoot, "backend", "tests"),
    path.join(projectRoot, "frontend", "api.js"),
    path.join(projectRoot, "frontend", "main.js"),
    path.join(projectRoot, "frontend", "admin.js")
];

function collectJavaScript(target, output = []) {
    if (!fs.existsSync(target)) return output;
    const stat = fs.statSync(target);
    if (stat.isFile() && target.endsWith(".js")) output.push(target);
    if (stat.isDirectory()) {
        for (const entry of fs.readdirSync(target)) {
            if (entry === "node_modules") continue;
            collectJavaScript(path.join(target, entry), output);
        }
    }
    return output;
}

const files = [...new Set(targets.flatMap((target) => collectJavaScript(target)))];
let failed = false;

for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
        failed = true;
        console.error(`\nLỗi cú pháp: ${path.relative(projectRoot, file)}`);
        console.error(result.stderr || result.stdout);
    }
}

if (failed) process.exit(1);
console.log(`Đã kiểm tra cú pháp ${files.length} tệp JavaScript.`);
