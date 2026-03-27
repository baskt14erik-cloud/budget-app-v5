# Flujo recomendado: QR + OCR asistido para INE

## Principio de diseño

**QR del INE = apoyo, no fuente única**

La razón es operativa: el QR puede servir como señal útil, pero no debe ser la única base para poblar identidad. El INE publica servicios de verificación para instituciones y además señala que la validación de datos requiere autorización o consentimiento del titular. citeturn952605search2turn952605search12

## Flujo de producto

### Paso 1. QR
- Lectura rápida del QR con cámara
- Captura de CURP, clave de elector, sección y otros identificadores cuando existan

### Paso 2. OCR del frente
- Texto del frente para reforzar nombre y domicilio
- Detección de posibles discrepancias con QR

### Paso 3. Fusión de señales
El backend combina:
- `qrRaw`
- `ocrText`
- `manual`

Y devuelve:
- identidad unificada
- `confidence`
- `reviewFlags`

### Paso 4. Confirmación humana
El usuario confirma antes del alta/login.

## Qué sí hace esta versión

- Parser heurístico para QR
- Parser heurístico para texto OCR pegado
- Detección básica de inconsistencias
- Confirmación manual final

## Qué no hace todavía

- Validación oficial con INE
- OCR automático 100% nativo ya conectado
- selfie/liveness
- score antifraude avanzado

## Endpoints

### `POST /api/identity/assist`

Payload de ejemplo:

```json
{
  "qrRaw": "...contenido leído del QR...",
  "ocrText": "NOMBRE JUAN PEREZ LOPEZ DOMICILIO ...",
  "manual": {
    "phone": "9510000000",
    "email": "demo@correo.com"
  }
}
```

Respuesta:

```json
{
  "qr": { "source": "qr" },
  "ocr": { "source": "ocr" },
  "merged": {
    "fullName": "Juan Perez Lopez",
    "curp": "XXXX000000HXX...",
    "claveElector": "...",
    "confidence": "0.75",
    "reviewFlags": []
  }
}
```

## Referencias técnicas

Google ML Kit mantiene OCR on-device para Android e iOS, y Expo documenta `expo-camera` para preview, captura y lectura de códigos. Para una versión posterior con OCR automático dentro de React Native, conviene una build nativa con Vision Camera + un plugin OCR basado en ML Kit. citeturn952605search3turn567952search0turn567952search10turn567952search11
