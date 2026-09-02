import React from "react";
import { AbsoluteFill, Composition, Easing, interpolate, registerRoot, useCurrentFrame } from "remotion";

const green = "#38e58c";
const muted = "#91a0af";
const ease = Easing.bezier(0.16, 1, 0.3, 1);

function Fade({ from, children, style = {} }) {
  const frame = useCurrentFrame();
  return <div style={{ opacity: interpolate(frame, [from, from + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }), translate: `0 ${interpolate(frame, [from, from + 18], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}px`, ...style }}>{children}</div>;
}

function Badge({ children }) {
  return <span style={{ background: "#123b2a", color: green, border: `1px solid ${green}55`, borderRadius: 999, padding: "8px 14px", fontSize: 20 }}>{children}</span>;
}

function VaultMark() {
  const frame = useCurrentFrame();
  return <div style={{ width: 148, height: 148, borderRadius: 34, background: "#173e31", display: "grid", placeItems: "center", boxShadow: `0 0 ${interpolate(frame, [0, 90, 180], [18, 42, 18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px #38e58c44` }}><div style={{ fontSize: 78 }}>🔐</div></div>;
}

function Terminal({ children, x = 0 }) {
  const dot = { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 };
  return <div style={{ position: "absolute", left: x, top: 0, width: 610, height: 370, border: "1px solid #293847", borderRadius: 18, background: "#0c131b", boxShadow: "0 22px 50px #0008", overflow: "hidden" }}><div style={{ height: 46, background: "#131f2b", display: "flex", alignItems: "center", gap: 9, padding: "0 17px" }}><i style={{ ...dot, background: "#ff6b6b" }} /><i style={{ ...dot, background: "#ffd166" }} /><i style={{ ...dot, background: green }} /><span style={{ color: muted, marginLeft: 10, fontSize: 17 }}>agent@workspace</span></div><div style={{ padding: 28, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 20, lineHeight: 1.7 }}>{children}</div></div>;
}

function App() {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [0, 45, 90], [0.92, 1.08, 0.92], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#071017", color: "#f4f7f8", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 75% 20%, #124333 0, transparent 36%), radial-gradient(circle at 20% 80%, #102c43 0, transparent 34%)" }} />
    <div style={{ position: "absolute", top: 52, left: 68, right: 68, display: "flex", justifyContent: "space-between", alignItems: "center", color: muted, fontSize: 19, letterSpacing: 1 }}><span>SECRET VAULT</span><span>SELF-HOSTED · AES-256-GCM</span></div>
    <div style={{ position: "absolute", left: 86, top: 145, width: 1100 }}>
      <Fade from={0} style={{ display: "flex", alignItems: "center", gap: 34 }}><VaultMark /><div><div style={{ fontSize: 68, fontWeight: 800, letterSpacing: -2 }}>Usá la key.</div><div style={{ fontSize: 68, fontWeight: 800, color: green, letterSpacing: -2 }}>No la leas.</div><p style={{ fontSize: 27, color: muted, marginTop: 24 }}>Secret Vault mantiene el valor fuera del contexto del agente.</p></div></Fade>
    </div>
    <Fade from={75} style={{ position: "absolute", left: 88, top: 540, display: "flex", gap: 12 }}><Badge>SERVER-SIDE</Badge><Badge>REDACTED OUTPUT</Badge><Badge>AGENT-SAFE</Badge></Fade>
    <Fade from={108} style={{ position: "absolute", left: 75, top: 120, width: 1120, height: 490 }}><div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Terminal x={0}><div><span style={{ color: green }}>$</span> curl -s /api/secrets</div><div style={{ color: "#c5d1da", marginTop: 18 }}>{`{ "secrets": [{ "name": "GITHUB_TOKEN",`}</div><div style={{ color: "#c5d1da" }}>{`  "has_value": true }] }`}</div><div style={{ color: muted, marginTop: 18 }}># solo nombre y metadatos</div></Terminal>
      <Terminal x={510}><div><span style={{ color: green }}>$</span> POST /api/use/GITHUB_TOKEN</div><div style={{ color: "#c5d1da", marginTop: 18 }}>{`{ "action": "http", "ok": true,`}</div><div style={{ color: "#c5d1da" }}>{`  "status": 200, "data": "***" }`}</div><div style={{ color: green, marginTop: 18 }}>✓ valor resuelto en el servidor</div></Terminal>
    </div></Fade>
    <Fade from={198} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><div style={{ textAlign: "center" }}><div style={{ transform: `scale(${pulse})`, fontSize: 108, color: green }}>✓</div><div style={{ fontSize: 58, fontWeight: 750, marginTop: 18 }}>El agente recibe el resultado.</div><div style={{ fontSize: 30, color: muted, marginTop: 12 }}>El secreto nunca aparece en la respuesta.</div></div></Fade>
    <div style={{ position: "absolute", bottom: 44, left: 68, color: muted, fontSize: 17 }}>vault-env · /api/use/:name · localhost:8100</div>
  </AbsoluteFill>;
}

export const RemotionRoot = () => <Composition id="SecretVaultDemo" component={App} durationInFrames={270} fps={30} width={1280} height={720} />;

registerRoot(RemotionRoot);
