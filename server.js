#!/usr/bin/env node
// server.js — Secret Vault: guarda secretos, expone tool-opaca /api/use.
// Los valores NUNCA salen por HTTP; /api/use los resuelve internamente.
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import * as store from "./lib/store.js";
import { useSecret } from "./lib/use.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const PUBLIC = join(ROOT, "public");
const PORT = parseInt(process.env.SECRET_VAULT_PORT || "8100", 10);

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}
function bodyJson(req) {
  return new Promise((res) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => { try { res(JSON.parse(b || "{}")); } catch { res(null); } });
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // CORS simple para agentes de otros entornos (tailnet)
  res.writeHead = res.writeHead.bind(res);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // ── API ─────────────────────────────────────────────
  if (path === "/api/secrets" && req.method === "POST") {
    const b = await bodyJson(req);
    if (!b?.name || b.value == null) return sendJson(res, 400, { ok: false, error: "name y value requeridos" });
    const saved = store.setSecret(b.name, String(b.value), b.description || "");
    return sendJson(res, 201, { ok: true, ...saved });
  }

  if (path === "/api/secrets" && req.method === "GET") {
    // Sin revelar: solo nombres (para agentes / sin master key)
    const reveal = url.searchParams.get("reveal") === "1";
    const key = req.headers["x-master-key"] || url.searchParams.get("key") || "";
    if (reveal && key !== store.master()) return sendJson(res, 401, { ok: false, error: "unauthorized" });
    const secrets = reveal ? store.listSecretsWithValues() : store.listSecrets();
    return sendJson(res, 200, { ok: true, secrets });
  }

  if (path.startsWith("/api/secrets/") && req.method === "DELETE") {
    const name = decodeURIComponent(path.replace("/api/secrets/", ""));
    const r = store.deleteSecret(name);
    return sendJson(res, r.ok ? 200 : 404, { ok: r.ok });
  }

  if (path.startsWith("/api/use/") && req.method === "POST") {
    const name = decodeURIComponent(path.replace("/api/use/", ""));
    const b = await bodyJson(req);
    const r = await useSecret(name, b?.action, b?.params);
    const code = r.ok ? 200 : (r.error?.includes("no existe") ? 404 : 400);
    return sendJson(res, code, r);
  }

  // ── Inyección de env para notebooks/agentes ─────────
  // Devuelve los valores en formatos listos para pegar/ejecutar:
  //   /api/env.py?names=A,B   → código python: os.environ.update({...})
  //   /api/env.sh?names=A,B   → export A='...'; export B='...'
  //   /api/env.json?names=A,B → {"A": "...", "B": "..."}
  // Filtros: names=A,B (lista) | prefix=ABC | nada = todos.
  if (path === "/api/env.py" || path === "/api/env.sh" || path === "/api/env.json") {
    const all = store.listSecretsWithValues();
    const namesParam = url.searchParams.get("names");
    const prefix = url.searchParams.get("prefix");
    let picked = all;
    if (namesParam) {
      const wanted = namesParam.split(",").map((s) => s.trim()).filter(Boolean);
      const missing = wanted.filter((w) => !all.some((s) => s.name === w));
      if (missing.length) return sendJson(res, 404, { ok: false, error: "no existen", missing });
      picked = wanted.map((w) => all.find((s) => s.name === w));
    } else if (prefix) {
      picked = all.filter((s) => s.name.startsWith(prefix));
    }
    const map = Object.fromEntries(picked.map((s) => [s.name, s.value]));
    if (path === "/api/env.json") return sendJson(res, 200, map);
    if (path === "/api/env.py") {
      const code = `import os\nos.environ.update(${JSON.stringify(map)})\n`;
      res.writeHead(200, { "Content-Type": "text/x-python; charset=utf-8" });
      return res.end(code);
    }
    const sh = picked
      .map((s) => `export ${s.name}='${String(s.value).replace(/'/g, `'\\''`)}'`)
      .join("\n");
    res.writeHead(200, { "Content-Type": "text/x-shellscript; charset=utf-8" });
    return res.end(sh + "\n");
  }

  // ── Frontend estático ───────────────────────────────
  const file = path === "/" ? "index.html" : path.slice(1);
  const full = join(PUBLIC, file);
  if (!existsSync(full)) return sendJson(res, 404, { ok: false, error: "not found" });
  const data = readFileSync(full);
  res.setHeader("Content-Type", MIME[extname(full)] || "application/octet-stream");
  res.writeHead(200);
  res.end(data);
});

server.listen(PORT, () => {
  console.log(`Secret Vault escuchando en http://0.0.0.0:${PORT}`);
  console.log(`(interfaces: tailnet/hermes-server:${PORT})`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());