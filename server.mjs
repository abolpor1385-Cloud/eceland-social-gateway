import http from "node:http";

const PORT = Number(process.env.PORT || 8000);

const ALLOWED_HOSTS = new Set([
  "www.instagram.com",
  "instagram.com",
  "t.me",
  "telegram.me"
]);

function sendJson(res, status, data) {
  const body = JSON.stringify(data);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(body);
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      throw new Error("HTTPS required");
    }

    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
      throw new Error("Destination not allowed");
    }

    return url;
  } catch {
    return null;
  }
}

async function fetchRemote(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EcelandKidsSocialGateway/1.0)",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fa,en;q=0.8"
      }
    });

    const finalUrl = new URL(response.url);

    if (
      finalUrl.protocol !== "https:" ||
      !ALLOWED_HOSTS.has(finalUrl.hostname.toLowerCase())
    ) {
      return {
        ok: false,
        error: "REMOTE_REDIRECT_NOT_ALLOWED"
      };
    }

    const contentType = String(
      response.headers.get("content-type") || ""
    );

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      contentType,
      finalUrl: response.url,
      text: text.slice(0, 12 * 1024 * 1024)
    };
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer(async (req, res) => {
 
