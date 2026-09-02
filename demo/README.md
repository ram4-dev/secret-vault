# Video de demo

El video `outputs/secret-vault-demo.mp4` es una explicación visual de 9 segundos, 1280×720, 30 fps y sin credenciales reales. `outputs/secret-vault-demo.gif` es su preview animado para visores de README que no reproducen MP4 inline.

## Render

```bash
npm install
npm run render
npm run still
```

La composición usa `useCurrentFrame()` e `interpolate()` para animar el flujo. El mock visual representa respuestas del API; no inicia el servidor ni hace llamadas externas durante el render.
