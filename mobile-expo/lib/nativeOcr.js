import { NativeModules, Platform } from 'react-native';

const bridge = NativeModules.IneOcrBridge;

export function hasNativeOcr() {
  return Platform.OS === 'android' && !!bridge?.scanFrontFromCamera;
}

export async function scanIneFrontWithNativeOcr() {
  if (!hasNativeOcr()) {
    return {
      available: false,
      text: '',
      fields: {},
      message: 'El módulo nativo OCR no está disponible en esta build. Usa Android development build o APK interna.',
    };
  }

  const result = await bridge.scanFrontFromCamera();
  return {
    available: true,
    text: result?.text || '',
    fields: result?.fields || {},
    blocks: result?.blocks || [],
    message: result?.message || 'OCR automático completado.',
  };
}
