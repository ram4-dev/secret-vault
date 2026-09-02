// lib/use.js — Resuelve una acción que usa un secreto SIN exponer el valor.
// Ejecuta DENTRO del entorno del servidor de la Vault; el agente recibe solo
// el resultado de la acción, nunca el valor del secreto.
import * as store from "./store.js";
import { spawn } from "node:child_process";

function redact(text, secrets) {
  for (const sv of secrets) if (sv) text = text.split(sv).join("***");
  return text;
}

async function execAction(params) {
  // params: { command: string|string[], deplierEnv?: string, args?: string[] }
  // El comando corre con la key inyectada como variable de entorno (no en texto).
  const cmd = params?.command;
  if (!cmd) return { ok: false, error: "params.command required" };
  const injects = params?.secrets && params.secrets.length ? params.secrets : [params?.secretEnv || "SECRET"];

  const envVars = { ...process.env };
  for (const n of injects) {
    const v = store.resolveSecret(n);
    if (v != null) envVars[n] = v;
  }
  const argv = Array.isArray(cmd) ? cmd.map(String) : cmd.split(/\s+/);
  const child = spawn(argv[0], argv.slice(1), { env: envVars });
  let stdout = "", stderr = "";
  child.stdout?.on("data", (d) => (stdout += d));
  child.stderr?.on("data", (d) => (stderr += d));
  const exitCode = await new Promise((res) => child.on("close", res));

  const secretValues = injects.map((n) => store.resolveSecret(n)).filter(Boolean);
  return { ok: exitCode === 0, exitCode, stdout: redact(stdout, secretValues), stderr: redact(stderr, secretValues) };
}

async function httpAction(params) {
  // params: { url, method, headers?, body?, inject: [{header|body|query|path, secret}] }
  const { url, method = "GET", headers = {}, body, inject = [] } = params || {};
  if (!url) return { ok: false, error: "params.url required" };

  let h = { ...headers };
  let finalBody = body;

  for (const inj of inject) {
    const secretValue = store.resolveSecret(inj.secret);
    if (secretValue == null) return { ok: false, error: `secreto '${inj.secret}' no existe` };
    if (inj.header) h[inj.header] = secretValue;
    else if (inj.query) { const u = new URL(url); u.searchParams.set(inj.query, secretValue); url = u.toString(); }
    else if (inj.body) finalBody = finalBody.replace(`{{${inj.placeholder || inj.secret}}}`, secretValue);
  }

  const res = await fetch(url, {
    method,
    headers: h,
    body: finalBody != null ? (typeof finalBody === "string" ? finalBody : JSON.stringify(finalBody)) : undefined,
  });
  let text = await res.text();
  // REDACTAR: si la API externa refleja el secreto (headers/body), lo ocultamos
  // antes de devolverlo al agente. El valor NUNCA sale.
  for (const inj of inject) {
    const sv = store.resolveSecret(inj.secret);
    if (sv) text = text.split(sv).join("***");
  }
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, data: data ?? text };
}

export async function useSecret(name, action, params) {
  const meta = store.secretMeta(name);
  if (!meta) return { ok: false, error: `secreto '${name}' no existe` };

  switch (action) {
    case "echo": {
      // Confirma disponibilidad y tamaño, NUNCA el valor.
      return { ok: true, action, name, valueLength: meta.valueLength, note: "secreto disponible (valor oculto)" };
    }
    case "http": {
      const r = await httpAction(params);
      return { ok: r.ok, action, name, ...r };
    }
    case "exec": {
      const r = await execAction(params);
      return { ok: r.ok, action, name, ...r };
    }
    default:
      return { ok: false, error: `acción '${action}' desconocida (echo|http|exec)` };
  }
}