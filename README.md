# Secret Vault

Self-hosted secret manager with an **opaque tool pattern** for AI agents: agents can *use* secrets without the values ever entering the LLM context, and provision `.env` files with a one-line command.

Runs on the LAN/tailnet (default port `8100`). Values are encrypted at rest (AES-256-GCM) behind a server-side master key.

## Why

Coding agents sometimes need credentials for real API calls. If the agent can read the env var, the value lands in the LLM context/dialog. This vault splits the two concerns:

- **Use without reading** — the server injects the secret server-side (`/api/use/:name`), redacts it from responses.
- **Provision without reading** — `vault-env` moves values straight from vault → `.env` file or process env. The agent builds the command; values travel vault → destination directly, and the CLI output shows only names and counts.

## Quick start

```bash
npm start                    # or: node server.js
SECRET_VAULT_MASTER=... node server.js   # master key (or via env file)
```

UI at `http://localhost:8100`. Paste the master key in the UI to reveal values (owner console only).

## API

| Endpoint | What |
|---|---|
| `POST /api/secrets` `{name, value, description?}` | create/update (upsert) |
| `GET /api/secrets` | list **names only** — agent discovery |
| `GET /api/secrets?reveal=1` + `X-Master-Key` | list with values (owner) |
| `POST /api/use/:name` `{action: echo\|http\|exec, ...}` | **opaque tools**: `echo` proves existence (length only); `http` runs a request with the secret injected as header/query/body (response redacted); `exec` runs a command with the secret as env var (output redacted) |
| `DELETE /api/secrets/:name` | remove |
| `GET /api/env.py\|env.sh\|env.json?names=A,B` or `?prefix=P` | one-shot injection formats: python `os.environ.update({...})`, shell `export` lines, raw JSON. **Values appear in the response** — for direct exec into a notebook/agent runtime, not for pasting into model context |

## vault-env CLI

```bash
vault-env to /path/project/.env --names GH_TOKEN,NAN_API_KEY
# ✓ 2 secretos → /path/project/.env (2 claves totales, permisos 600)

vault-env to .env --append --prefix COMPASS_   # merge by key
vault-env run --names GH_TOKEN -- git push ...  # inject into a process, exit code inherited
vault-env list                                  # names only
```

- Values never appear in stdout — the CLI prints names/counts only.
- Atomic write (tmp + rename), perms `600`.
- Requires explicit `--names` / `--prefix` / `--all` (no accidental dumps).
- `VAULT_URL` env var overrides the vault endpoint (default `http://127.0.0.1:8100`).

## Notebook one-liner (model-friendly)

```python
exec(__import__('urllib.request', fromlist=['x']).urlopen("http://<vault-host>:8100/api/env.py").read())
# now os.environ has every secret
```

## Security model

- Values encrypted at rest (AES-256-GCM, master key `SECRET_VAULT_MASTER`).
- Master key never leaves the server owner's console.
- `/api/env.*` and the LAN surface are **unauthenticated by design** — treat the host as the trust boundary: LAN/tailnet only, never expose publicly.
- Agents are expected to prefer `vault-env` / `/api/use` (opaque) over `/api/env.*` (direct values).

## Layout

```
server.js          HTTP server + routes
lib/store.js       encrypted store (load/save/upsert/delete)
lib/use.js         opaque actions (echo/http/exec) + redaction
bin/vault-env      CLI: vault → .env / process env
public/            web UI
tests/run.js       test runner
```

## Tests

```bash
npm test
```
