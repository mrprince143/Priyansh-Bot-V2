//===============================//
//      PRIYANSH BOT LAUNCHER
//===============================//

const { spawn } = require("child_process");
const axios = require("axios");
const express = require("express");
const path = require("path");

// Safe import logger
let logger;
try {
  logger = require("./utils/log");
  if (typeof logger !== "function") {
    console.log("[WARN] Invalid logger, using console.log instead.");
    logger = console.log;
  }
} catch (e) {
  console.log("[WARN] Logger not found, using console.log instead.");
  logger = console.log;
}

//===============================//
//      EXPRESS WEB SERVER
//===============================//

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "index.html"));
  } catch (err) {
    res.send("<h2>Priyansh Bot is Running...</h2>");
  }
});

app.listen(port, () => {
  logger(`Server is running on port ${port}...`, "[ Starting ]");
}).on("error", (err) => {
  if (err.code === "EACCES") {
    logger(`Permission denied. Cannot bind to port ${port}.`, "[ Error ]");
  } else {
    logger(`Server error: ${err.message}`, "[ Error ]");
  }
});

//===============================//
//      BOT AUTO RESTART LOOP
//===============================//

global.countRestart = global.countRestart || 0;

function startBot(message) {
  if (message) logger(message, "[ Starting ]");

  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Priyansh.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("error", (error) => {
    logger(`Bot process error: ${error.stack || error.message}`, "[ Error ]");
  });

  child.on("close", (codeExit) => {
    if (codeExit !== 0) {
      logger(`Bot exited with code ${codeExit}`, "[ Exit ]");
      if (global.countRestart < 5) {
        global.countRestart++;
        logger(`Restarting... (${global.countRestart}/5)`, "[ Restarting ]");
        setTimeout(() => startBot(), 3000); // 3 sec delay
      } else {
        logger("Bot stopped after max restarts.", "[ Stopped ]");
      }
    } else {
      logger("Bot exited normally (code 0)", "[ Exit ]");
    }
  });
}

//===============================//
//      GITHUB UPDATE CHECK
//===============================//

try {
  const pkg = require("./package.json");
  logger(pkg.name, "[ NAME ]");
  logger(`Version: ${pkg.version}`, "[ VERSION ]");
  logger(pkg.description || "No description", "[ DESCRIPTION ]");

  axios.get("https://raw.githubusercontent.com/codedbypriyansh/Priyansh-Bot/main/package.json")
    .then((res) => {
      if (res.data?.version && res.data.version !== pkg.version) {
        logger(`Update available: ${res.data.version} (current: ${pkg.version})`, "[ UPDATE ]");
      } else {
        logger("You're using the latest version.", "[ INFO ]");
      }
    })
    .catch((err) => {
      logger(`Update check failed: ${err.message}`, "[ Update Error ]");
    });

} catch (err) {
  logger(`Failed to read package.json: ${err.message}`, "[ Error ]");
}

//===============================//
//      START THE BOT
//===============================//

startBot("Starting Priyansh Bot...");
