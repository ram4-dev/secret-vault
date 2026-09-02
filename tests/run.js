// tests/run.js — verifica el requisito de seguridad central:
//   el agente puede USAR secretos pero NO leer sus valores.
// Hermético: corre contra un data dir temporal y una master key de test,
// jamás toca data/secrets.enc real.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.SECRET_VAULT_MASTER = "test-master-key-please-change";
process.env.SECRET_VAULT_DATA_DIR = mkdtempSync(join(tmpdir(), "vault-test-"));

const TEST_VALUE = "skp-super-secret-test-value-26ch"; // 26 chars exactos
let pass = 0, fail = 0;
const ok = (label, cond) => { console.log((cond ? "  ✓ " : "  ✗ ") + label); cond ? pass++ : fail++; };

const store = await import(`../lib/store.js?${Date.now()}`);
const { useSecret } = await import(`../lib/use.js?${Date.now()}`);

// 1. guardar sin exponer valor
const saved = store.setSecret("TEST_KEY", TEST_VALUE, "test");
ok("setSecret guarda sin devolver valor", saved.value === undefined && saved.name === "TEST_KEY");

// 2. listar solo nombres
const list = store.listSecrets();
const found = list.find((s) => s.name === "TEST_KEY");
ok("listSecrets NO expone valor", found && !("value" in found) && found.has_value === true);

// 3. uso opaco 'echo' — dice disponible y longitud, NO el valor
const echo = await useSecret("TEST_KEY", "echo", {});
ok("use(echo) no filtra el valor", echo.ok && echo.valueLength === TEST_VALUE.length && !("value" in echo));
console.log("    → " + JSON.stringify(echo));

// 4. el valor nunca aparece en la respuesta
ok("respuesta use() no incluye valor plano", !JSON.stringify(echo).includes(TEST_VALUE));

// 5. exec — comando libre con key en variables de entorno, output redactado
const execR = await useSecret("TEST_KEY", "exec", {
  command: ["/bin/sh", "-c", "echo $TEST_KEY"],
  secretEnv: "TEST_KEY",
});
console.log("    exec → " + JSON.stringify(execR));
ok("exec corre el comando", execR.ok === true);
ok("exec NO filtra el valor en stdout", !JSON.stringify(execR).includes(TEST_VALUE));

// 6. http — inyección por header, respuesta redactada
const httpR = await useSecret("TEST_KEY", "http", {
  url: "https://httpbin.org/headers",
  method: "GET",
  inject: [{ header: "X-Test-Secret", secret: "TEST_KEY" }],
});
console.log("    http → " + JSON.stringify(httpR).slice(0, 300));
const respStr = JSON.stringify(httpR);
ok("http no incluye el valor secreto en la respuesta", !respStr.includes(TEST_VALUE) && httpR.ok);

// cleanup
store.deleteSecret("TEST_KEY");
rmSync(process.env.SECRET_VAULT_DATA_DIR, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
