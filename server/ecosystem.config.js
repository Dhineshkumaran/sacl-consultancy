const path = require("path");
const fs = require("fs");

if (!fs.existsSync(path.join(__dirname, "logs"))) {
    fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });
}

module.exports = {
    apps: [
        {
            name: "backend",
            script: "./src/index.js",
            instances: "max",
            exec_mode: "cluster",
            autorestart: true,
            watch: false,
            max_memory_restart: "300M",

            env: {
                NODE_ENV: "production",
                PORT: 9012
            },

            error_file: path.join(__dirname, "logs/backend-error.log"),
            out_file: path.join(__dirname, "logs/backend-out.log"),
            log_date_format: "YYYY-MM-DD HH:mm:ss"
        }
    ]
};
