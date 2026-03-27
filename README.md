# Budget App Pro v5

Versión web + backend + app móvil Android/iPhone con onboarding asistido para INE y ruta beta de OCR automático en Android.

## Qué cambia en esta versión

- Conserva el enfoque **QR del INE = apoyo, no fuente única**
- Añade **OCR automático beta en Android** mediante development build
- Mantiene QR + OCR asistido como fallback seguro
- Añade revisión heurística con puntaje vía `POST /api/identity/review`
- Incluye `eas.json` y config plugin para preparar la build nativa

## Qué sí hace

- Escanear QR
- Combinar QR + OCR + captura manual
- Emitir banderas de revisión
- Calcular un puntaje de consistencia
- Pedir confirmación final al usuario

## Qué no queda totalmente cerrado en esta entrega

- Implementación Java/Kotlin final del puente nativo validada en dispositivo
- Verificación institucional con INE
- Liveness o comparación facial

## Levantar backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

## Levantar móvil en Expo Go

```bash
cd mobile-expo
npm install
npm run android
```

## Build Android con capacidades nativas

```bash
cd mobile-expo
npm install
npx expo prebuild
npx expo run:android
```

o con EAS:

```bash
eas build --platform android --profile development
```

## Documentación clave

- `docs/ANDROID_INSTALL.md`
- `docs/ANDROID_V5_OCR_INSTALL.md`
- `docs/INE_QR_OCR_FLOW.md`
- `docs/V5_CHANGES.md`
