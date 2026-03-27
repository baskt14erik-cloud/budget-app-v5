# Android + QR INE

## Qué quedó preparado

- Proyecto Expo unificado para Android e iOS.
- Script `npm run android`.
- Configuración `app.json` con permisos de cámara.
- Pantalla de ingreso con lector QR mediante `expo-camera`.
- Parser flexible en `mobile-expo/lib/ine.js`.
- Backend demo para registrar o reingresar con CURP.

## Instalar en Android

1. Instala Android Studio.
2. Configura un emulador o conecta un Android por USB.
3. En `mobile-expo` ejecuta:

```bash
npm install
npx expo install expo-camera expo-local-authentication expo-secure-store
npm run android
```

## Probar en teléfono Android

También puedes usar Expo Go. Expo documenta que `expo-camera` permite detectar códigos de barras/QR desde `CameraView`, y Expo mantiene un solo proyecto para Android/iOS/web. citeturn165882search1turn165882search3

## Sobre la INE

El INE publica servicios y aplicaciones para leer o verificar ciertos códigos QR de sus credenciales/constancias, y además ofrece un servicio de verificación de datos para instituciones bajo convenio. citeturn484074search1turn484074search14

Por eso, en esta versión el QR se usa como **prefill asistido**. Si luego quieres una versión institucional más fuerte, el siguiente salto es integrar una verificación adicional de identidad y reglas de tratamiento de datos.
