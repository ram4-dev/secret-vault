import React from "react";
import { AbsoluteFill, Composition, Easing, interpolate, registerRoot, useCurrentFrame } from "remotion";

const green = "#38e58c";
const cyan = "#67c9ff";
const muted = "#91a0af";
const ease = Easing.bezier(0.16, 1, 0.3, 1);

function Fade({ from, to = from + 20, out, children, style = {} }) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const fadeOut = out == null ? 1 : interpolate(frame, [out, out + 20], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return <div style={{ opacity: Math.min(fadeIn, fadeOut), translate: `0 ${interpolate(frame, [from, to], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}px`, ...style }}>{children}</div>;
}

function Badge({ children, color = green }) {
  return <span style={{ background: `${color}18`, color, border: `1px solid ${color}66`, borderRadius: 999, padding: "8px 14px", fontSize: 20 }}>{children}</span>;
}

function VaultCard() {
  const frame = useCurrentFrame();
  return <div style={{ width: 420, height: 300, border: "1px solid #315545", borderRadius: 22, background: "#0d211b", boxShadow: `0 0 ${interpolate(frame, [80, 130, 180], [15, 38, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px #38e58c33`, padding: 28 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 15 }}><div style={{ width: 58, height: 58, borderRadius: 15, background: "#173e31", display: "grid", placeItems: "center", fontSize: 31 }}>🔐</div><div><div style={{ fontSize: 25, fontWeight: 750 }}>Secret Vault</div><div style={{ color: muted, fontSize: 17 }}>consola central</div></div></div>
    <div style={{ marginTop: 28, display: "grid", gap: 12, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 18 }}><div style={{ color: cyan }}>● GITHUB_TOKEN <span style={{ color: muted }}>••••••</span></div><div style={{ color: cyan }}>● OPENAI_API_KEY <span style={{ color: muted }}>••••••</span></div><div style={{ color: cyan }}>● COMPASS_API_KEY <span style={{ color: muted }}>••••••</span></div></div>
    <div style={{ marginTop: 25, color: green, fontSize: 17 }}>✓ cifrados en reposo</div>
  </div>;
}

function ProjectCard({ title, x, y }) {
  return <div style={{ position: "absolute", left: x, top: y, width: 270, height: 112, border: "1px solid #294052", borderRadius: 16, background: "#0c1721", padding: "18px 20px", boxShadow: "0 12px 30px #0005" }}><div style={{ color: "#f4f7f8", fontSize: 20, fontWeight: 700 }}>{title}</div><div style={{ color: muted, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 16, marginTop: 14 }}>.env · 2 claves</div></div>;
}

function Terminal() {
  return <div style={{ width: 700, height: 310, border: "1px solid #293847", borderRadius: 18, background: "#0c131b", boxShadow: "0 22px 50px #0008", overflow: "hidden" }}><div style={{ height: 46, background: "#131f2b", display: "flex", alignItems: "center", gap: 9, padding: "0 17px" }}><i style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff6b6b" }} /><i style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffd166" }} /><i style={{ width: 10, height: 10, borderRadius: "50%", background: green }} /><span style={{ color: muted, marginLeft: 10, fontSize: 17 }}>project-a · terminal</span></div><div style={{ padding: 28, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 20, lineHeight: 1.7 }}><div><span style={{ color: green }}>$</span> vault-env to .env --names</div><div style={{ paddingLeft: 24 }}>OPENAI_API_KEY,GITHUB_TOKEN</div><div style={{ color: green, marginTop: 18 }}>✓ 2 secretos → .env</div><div style={{ color: muted, fontSize: 17 }}>claves: GITHUB_TOKEN, OPENAI_API_KEY</div><div style={{ color: cyan, marginTop: 16 }}>sin valores en stdout · permisos 600</div></div></div>;
}

function App() {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [85, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const pulse = interpolate(frame, [200, 225, 250], [0.92, 1.08, 0.92], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#071017", color: "#f4f7f8", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 55% 25%, #124333 0, transparent 34%), radial-gradient(circle at 18% 80%, #102c43 0, transparent 34%)" }} />
    <div style={{ position: "absolute", top: 52, left: 68, right: 68, display: "flex", justifyContent: "space-between", color: muted, fontSize: 19, letterSpacing: 1 }}><span>SECRET VAULT</span><span>UNA FUENTE · MUCHOS PROYECTOS</span></div>
    <Fade from={0} to={18} out={55} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}><div><div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>Guardá una vez.</div><div style={{ fontSize: 72, fontWeight: 800, color: green, letterSpacing: -2 }}>Usalo donde quieras.</div><p style={{ color: muted, fontSize: 28, marginTop: 25 }}>Una consola central para tus secretos y proyectos.</p></div></Fade>
    <Fade from={55} to={72} out={180} style={{ position: "absolute", left: 90, top: 150, width: 1100, height: 430 }}><div style={{ position: "relative", width: "100%", height: "100%" }}><VaultCard /><div style={{ position: "absolute", left: 420, top: 112, width: 210, height: 2, background: `linear-gradient(90deg, ${green}00, ${green}, ${green}00)`, transformOrigin: "left", scale: `${line} 1` }} /><ProjectCard title="proyecto-a" x={690} y={25} /><ProjectCard title="proyecto-b" x={690} y={205} /><div style={{ position: "absolute", left: 458, top: 92, color: green, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 18 }}>vault-env</div></div></Fade>
    <Fade from={125} to={145} out={200} style={{ position: "absolute", left: 290, top: 190 }}><Terminal /></Fade>
    <Fade from={200} to={218} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}><div><div style={{ transform: `scale(${pulse})`, fontSize: 95, color: green }}>✓</div><div style={{ fontSize: 56, fontWeight: 780, marginTop: 10 }}>Sin volver a copiar secretos.</div><div style={{ fontSize: 29, color: muted, marginTop: 15 }}>El agente arma el comando. El proyecto recibe el entorno.</div><div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 30 }}><Badge>CONSOLA CENTRAL</Badge><Badge color={cyan}>.ENV / PROCESO</Badge><Badge>AGENT-SAFE</Badge></div></div></Fade>
    <div style={{ position: "absolute", bottom: 44, left: 68, color: muted, fontSize: 17 }}>vault-env · localhost:8100 · secretos centralizados</div>
  </AbsoluteFill>;
}

export const RemotionRoot = () => <Composition id="SecretVaultDemo" component={App} durationInFrames={270} fps={30} width={1280} height={720} />;

registerRoot(RemotionRoot);
