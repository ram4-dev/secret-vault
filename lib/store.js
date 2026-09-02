// lib/store.js — Almacén de secretos cifrado AES-256-GCM.
// El valor NUNCA se devuelve por la vía HTTP; solo se resuelve internamente
// para que lib/use.js pueda ejecutar llamadas autenticadas.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// raíz del proyecto (un nivel sobre lib/)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = process.env.SECRET_VAULT_DATA_DIR || join(ROOT, "data");
const FILE = join(DATA_DIR, "secrets.enc");

function masterKey() {
  const k = process.env.SECRET_VAULT_MASTER;
  if (!k) throw new Error("SECRET_VAULT_MASTER not set on server");
  return createHash("sha256").update(k).digest();
}

function encryptText(plain) {
  const key = masterKey();
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(Buffer.from(plain, "utf8")), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decryptText(blob) {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const dec = createDecipheriv("aes-256-gcm", masterKey(), iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(data), dec.final()]).toString("utf8");
}

function load() {
  if (!existsSync(FILE)) return {};
  return JSON.parse(decryptText(readFileSync(FILE, "utf8").trim()));
}

function save(doc) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, encryptText(JSON.stringify(doc, null, 2)) + "\n", "utf8");
  try { chmodSync(FILE, 0o600); } catch {}
}

export function setSecret(name, value, description = "") {
  const doc = load();
  const now = new Date().toISOString();
  doc[name] = { value, description, createdAt: doc[name]?.createdAt || now, updatedAt: now };
  save(doc);
  return { name, createdAt: doc[name].createdAt, updatedAt: now };
}

export function listSecrets() {
  const doc = load();
  return Object.entries(doc).map(([name, e]) => ({
    name,
    description: e.description || "",
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    has_value: true, // los agentes saben que hay valor, no qué valor
  }));
}

export function master() {
  return process.env.SECRET_VAULT_MASTER || "";
}

export function listSecretsWithValues() {
  const doc = load();
  return Object.entries(doc).map(([name, e]) => ({
    name,
    description: e.description || "",
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    value: e.value, // solo se expone con master key (consola del dueño)
  }));
}

export function deleteSecret(name) {
  const doc = load();
  const existed = name in doc;
  delete doc[name];
  save(doc);
  return { ok: existed };
}

export function existsSecret(name) {
  return name in load();
}

// Devuelve el valor SOLO para ejecutar acciones en el servidor (lib/use.js).
export function resolveSecret(name) {
  const e = load()[name];
  return e ? e.value : null;
}

export function secretMeta(name) {
  const e = load()[name];
  return e ? { name, description: e.description || "", createdAt: e.createdAt, updatedAt: e.updatedAt, valueLength: (e.value || "").length } : null;
}