# Secret Vault — Spec-Driven Development

## Goal
Una app self-hosted donde Ramiro gestiona secretos (nombre + valor) vía web, y donde los agentes (Hermes/coding agents) pueden **usar** esos secretos mediante una tool opaca — ejecutada en el servidor — pero **no pueden leer** el valor plano de la variable.

## Problem
Los agentes de código a veces necesitan credenciales (API keys, tokens) para hacer llamadas reales. Si el agente puede leer la variable de entorno, el valor queda expuesto en el contexto/diálogo del LLM. Necesitamos una capa donde el agente invoque una acción con el secreto pero el valor nunca llegue al LLM.

## Non-goals
- No es un gestor de claves criptográficas. Los secretos se cifran en reposo con una master key del servidor.
- No reemplaza a Keychain/secret managers cloud; es self-hosted local (tailnet).
- MVP: sin multi-usuario ni roles, sin auditoría avanzada.

## Architecture

```
[Frontend web]              → POST/GET/DELETE /secrets (solo nombres se listan)
[Backend Node + Express]    → store cifrado en datos/secrets.enc (AES-GCM, master key)
[Tool /use/:id]             → POST /use/:name  json { action, args }
                               el backend inyecta el secreto y ejecuta la acción
                               devuelve resultado SIN exponer el valor
```

## Endpoints

### `POST /api/secrets`
Body: `{ name, value, description? }`
- Guarda/cifra. Retorna `{ ok, name }` (nunca el valor).

### `GET /api/secrets`
- Lista `[{ name, description, createdAt, has_value: true }]` — los valores NUNCA salen.

### `DELETE /api/secrets/:name`
- Retorna `{ ok }`.

### `POST /api/use/:name`  ← LA TOOL
Body: `{ action, params }`
- `action: "http"` → hace un request autenticado (headers/body con el secreto interpolado), retorna el resultado de la API externa.
- `action: "echo_name"` → solo confirma que el secreto existe y está disponible (retorna la longitud, NO el valor).
- El servidor resuelve el secreto INTERNAMENTE; el response nunca incluye `secret.value`.

## Descripción de la tool para el agente (lo importante)

```
use_secret(name, action, params)
  - NO se le da al agente el valor del secreto
  - el agente llama use_secret; el backend ejecuta contra el destino real
  - response: { ok, action, result } — result puede contener data de la API externa,
    PERO el valor del secreto nunca aparece en ningún response/output/log
```

Esto permite el patrón "llamada autenticada sin ver la key".

## Tech
- Backend: Node 24 (ya en `.local/node24`) + Express, sin deps pesadas.
- Cifrado: AES-256-GCM con master key derivada de `SECRET_VAULT_MASTER` (env) en el server, no en repo.
- Frontend: HTML/CSS/JS puro (sin build), servido por el mismo Express.
- Persistencia: JSON cifrado en `data/secrets.enc`.

## Verificación (TDD)
1. POST /secrets guarda sin exponer valor.
2. GET /secrets lista solo nombres.
3. POST /use/:name with action echo → devuelve intensidad, no valor.
4. POST /use/:name with acción http → hace llamada real, no filtra key.
5. Intento de leer valor (GET value / nesta injolation) → rechazado.

## Files
- `package.json`
- `server.js` (Express + routes + store)
- `lib/store.js` (AES-GCM load/save)
- `lib/use.js` (tool resolver)
- `public/index.html` (UI)
- `public/app.js`, `public/style.css`
- `tests/…` (runner simple)
- `README.md`