# Android v5 con OCR automático

Esta versión añade una ruta **beta** para Android:

- QR del INE como apoyo
- OCR automático del frente en Android mediante **development build**
- Validación heurística local y revisión en backend
- Confirmación final del usuario

## Importante

- En **Expo Go** no debes esperar que el OCR nativo funcione.
- Para la parte automática usa **development build** o una **APK interna**.
- En iPhone el flujo sigue siendo QR + OCR asistido, a menos que después integres un módulo nativo específico.

## Opción A: probar rápido con Expo Go

```bash
cd mobile-expo
npm install
npx expo start
```

Con Expo Go podrás:
- escanear QR
- pegar OCR manual
- combinar y revisar

No podrás usar el botón de OCR automático.

## Opción B: Android con development build

### 1. Prepara el proyecto

```bash
cd mobile-expo
npm install
npx expo prebuild
```

### 2. Genera tu app Android local

```bash
npx expo run:android
```

Necesitas Android Studio, SDK y un emulador o teléfono con depuración USB.

### 3. Alternativa con EAS

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile development
```

Esto genera una build interna apta para probar librerías nativas. Expo documenta que los **development builds** son la vía adecuada cuando necesitas capacidades nativas fuera de Expo Go. citeturn565694search0turn565694search6turn565694search9

## Qué hace la build v5

1. Escanea el QR de la INE
2. Intenta OCR automático del frente
3. Envía QR + OCR + captura manual al backend
4. Calcula banderas de revisión y puntaje
5. Pide confirmación humana

## Dependencias nativas previstas

El config plugin agrega dependencias de **ML Kit Text Recognition** y **ML Kit Document Scanner** en Android. ML Kit documenta reconocimiento de texto on-device y un flujo de escaneo documental en Android que descarga parte de su lógica vía Google Play services. citeturn565694search20turn565694search2turn565694search5

## Si el botón de OCR dice que no está disponible

Eso significa que abriste la app en Expo Go o que el puente nativo no quedó compilado. En ese caso:

- sigue usando el flujo v4 asistido
- o recompila con `expo run:android` / `eas build`
