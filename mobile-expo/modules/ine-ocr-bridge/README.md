# IneOcrBridge (Android)

Este directorio documenta el puente nativo previsto para la v5:

- **Google ML Kit Text Recognition v2** para OCR on-device
- **ML Kit Document Scanner** para capturar el frente del INE con mejor recorte en Android
- Exposición de un método `scanFrontFromCamera()` al runtime de React Native

## Estado

Se entrega la **abstracción JS** y el **config plugin** para preparar un development build en Expo.  
No se incluye aquí una implementación Java/Kotlin totalmente compilada y validada porque este entorno no puede generar ni probar una build Android real.

## Contrato esperado

El puente debe responder un objeto con esta forma:

```json
{
  "text": "texto OCR completo",
  "fields": {
    "fullName": "Nombre detectado",
    "curp": "CURP detectada",
    "claveElector": "Clave detectada",
    "address": "Domicilio detectado",
    "section": "1234"
  },
  "blocks": [],
  "message": "OCR automático completado."
}
```

## Recomendación de implementación

1. Lanzar escáner de documento de ML Kit
2. Obtener imagen final del frente del INE
3. Crear `InputImage`
4. Ejecutar `TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)`
5. Parsear el texto resultante
6. Devolver el texto completo y campos heurísticos a JS
