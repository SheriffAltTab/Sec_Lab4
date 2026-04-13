const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const WEBROOT = __dirname;
const RECAPTCHA_SECRET = "6LcP1bUsAAAAAHZHGgI85LpObVxcUIpSvyOGkmeG";

function sendJson(res, data, statusCode = 200) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function sendFile(res, filePath) {
  const fullPath = path.join(WEBROOT, filePath);
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Файл не знайдено");
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8"
    }[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

function verifyRecaptchaToken(token, callback) {
  const params = new URLSearchParams({
    secret: RECAPTCHA_SECRET,
    response: token
  }).toString();

  const options = {
    method: "POST",
    hostname: "www.google.com",
    path: "/recaptcha/api/siteverify",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(params)
    }
  };

  const request = https.request(options, (response) => {
    let body = "";
    response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => {
      try {
        const json = JSON.parse(body);
        callback(null, json);
      } catch (parseError) {
        callback(parseError);
      }
    });
  });

  request.on("error", (error) => callback(error));
  request.write(params);
  request.end();
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/verify-recaptcha") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const requestData = JSON.parse(body);
        const token = String(requestData.token || "");

        if (!token) {
          sendJson(res, { success: false, message: "reCAPTCHA token не надано" }, 400);
          return;
        }

        verifyRecaptchaToken(token, (error, verification) => {
          if (error) {
            sendJson(res, { success: false, message: "Помилка перевірки reCAPTCHA", error: error.message }, 500);
            return;
          }

          sendJson(res, {
            success: Boolean(verification.success),
            challenge_ts: verification.challenge_ts,
            hostname: verification.hostname,
            "error-codes": verification["error-codes"] || []
          });
        });
      } catch (error) {
        sendJson(res, { success: false, message: "Неправильний формат запиту" }, 400);
      }
    });
    return;
  }

  if (req.method === "GET") {
    const requestedUrl = req.url === "/" ? "/index.html" : req.url;
    sendFile(res, requestedUrl);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ success: false, message: "Не знайдено" }));
});

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
  console.log("POST /verify-recaptcha для верифікації reCAPTCHA");
});
