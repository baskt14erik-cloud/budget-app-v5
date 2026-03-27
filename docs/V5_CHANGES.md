# Cambios de la v5

## Móvil Android

- Abstracción `nativeOcr.js`
- Botón para OCR automático del frente del INE
- Estado y mensajes de disponibilidad del módulo
- `eas.json` para builds internas y producción
- Config plugin `withIneOcrBridge`

## Backend

- Nuevo endpoint `POST /api/identity/review`
- Puntaje de revisión y recomendación de captura

## Alcance real

Esta entrega deja la **arquitectura lista** y el flujo UX preparado.  
La compilación final del OCR nativo requiere generar una build Android real, algo que no puedo verificar desde este entorno.
