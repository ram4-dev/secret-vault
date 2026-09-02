// app.js — frontend del Secret Vault
const $ = (id) => document.getElementById(id);
const msg = $("msg");
const secretsUl = $("secrets");
const countSpan = $("count");

function flash(t, ok = true) {
  msg.textContent = t;
  msg.style.color = ok ? "#00c46a" : "#d64550";
}

async function api(path, method = "GET", body) {
  const r = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

async function refreshList() {
  const key = $("master-key").value.trim();
  const q = key ? "?reveal=1" : "";
  const headers = key ? { "X-Master-Key": key } : {};
  const r = await fetch("/api/secrets" + q, { headers });
  const d = await r.json();
  secretsUl.innerHTML = "";
  if (!d.ok) {
    const li = document.createElement("li");
    li.textContent = "⚠️ " + (d.error || "no autorizado a revelar");
    li.style.color = "#d64550";
    secretsUl.appendChild(li);
  } else {
    for (const s of d.secrets || []) {
      const li = document.createElement("li");
      const val = key ? `<code class="val">${esc(s.value)}</code>` : "<span class='muted'>•••</span>";
      li.innerHTML = `<code>${esc(s.name)}</code> ${val} <span class="desc">${esc(s.description || "")}</span>
        <button data-name="${esc(s.name)}" class="del">×</button>`;
      secretsUl.appendChild(li);
    }
  }
  countSpan.textContent = `(${(d.secrets || []).length})`;
}

// releer cuando cambia la master key
$("master-key").oninput = () => refreshList();

function esc(t) {
  return (t || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

$("secret-form").onsubmit = async (e) => {
  e.preventDefault();
  const data = await api("/api/secrets", "POST", {
    name: $("s-name").value.trim(),
    value: $("s-value").value,
    description: $("s-desc").value.trim(),
  });
  if (data.ok) {
    flash(`Secret ${data.name} guardado.`);
    $("s-name").value = $("s-value").value = $("s-desc").value = "";
    refresh();
  } else {
    flash(data.error || "error", false);
  }
};

async function refresh() {
  await refreshList();
}

secretsUl.addEventListener("click", async (e) => {
  if (e.target.classList.contains("del")) {
    await api("/api/secrets/" + encodeURIComponent(e.target.dataset.name), "DELETE");
    refresh();
  }
});

$("btn-echo").onclick = async () => {
  const name = $("u-name").value.trim();
  if (!name) return;
  const out = await api("/api/use/" + encodeURIComponent(name), "POST", { action: "echo" });
  $("u-out").textContent = JSON.stringify(out, null, 2);
};

refresh();