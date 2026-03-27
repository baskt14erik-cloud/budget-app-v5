# Guía para instalar la app en Android

## Ruta rápida para probarla

### Opción A: emulador Android

1. Instala Android Studio.
2. Crea un emulador Android 12 o superior.
3. En el backend:

```bash
cd backend
npm install
npm run seed
npm run dev
```

4. En móvil:

```bash
cd mobile-expo
npm install
npm run android
```

Si el emulador no abre automáticamente:

```bash
npx expo start --android
```

### Opción B: teléfono Android real

1. Activa opciones de desarrollador y depuración USB.
2. Conecta el equipo por USB o usa la misma red Wi‑Fi.
3. En `mobile-expo/.env` define la IP local del backend:

```env
EXPO_PUBLIC_API_URL=http://192.168.X.X:4000
```

4. Corre:

```bash
cd mobile-expo
npm install
npx expo start
```

5. Abre en Android con Expo Go o una development build.

## Cuándo usar Expo Go y cuándo no

- **Expo Go**: sirve para revisar navegación, UI y el escaneo QR con `expo-camera`.
- **Development build**: es la mejor ruta si después conectas OCR nativo con Vision Camera + ML Kit, porque los módulos nativos no siempre funcionan dentro de Expo Go. Expo documenta que `expo-camera` ofrece captura, preview y escaneo de códigos con `CameraView`, y que los proyectos Expo pueden compilarse como builds de desarrollo para probar capacidades nativas más allá de Expo Go. citeturn567952search0turn952605search5

## Flujo que trae esta versión

1. Tocas **Escanear QR de INE**.
2. El QR llena campos base.
3. Pegas el texto OCR detectado del frente de la INE.
4. La app combina QR + OCR + edición manual.
5. Te muestra banderas de revisión.
6. Confirmas y entras.

## Recomendación técnica para la siguiente iteración

Para que el OCR sea totalmente automático en Android conviene integrar un motor nativo basado en ML Kit. Google documenta Text Recognition v2 como API on-device para extraer texto de imágenes y automatizar captura de datos, mientras que para React Native hay integraciones activas sobre Vision Camera/ML Kit que se usan en builds nativos. citeturn952605search1turn952605search3turn567952search10turn567952search11

## Problemas comunes

### La app no encuentra el backend
- Revisa `EXPO_PUBLIC_API_URL`
- Verifica firewall
- Usa IP local, no `localhost`

### La cámara no abre
- Da permiso de cámara en Android
- Reinstala la app si cambiaste permisos en caliente

### El QR llena poco
- Es normal: esta versión lo trata como apoyo inicial
- Completa con OCR y revisión humana
