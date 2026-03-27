function normalizeText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function titleCase(text = '') {
  return normalizeText(text)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function parseIneQr(rawValue = '') {
  const raw = normalizeText(rawValue);
  const upper = raw.toUpperCase();
  const result = {
    fullName: '',
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
    curp: '',
    claveElector: '',
    cic: '',
    ocr: '',
    address: '',
    section: '',
    raw,
    source: 'qr',
    confidence: 0.55,
  };

  const patterns = {
    curp: /\b([A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d)\b/,
    claveElector: /\b([A-Z]{6}\d{8}[HM][A-Z]{5}\d{2})\b/,
    cic: /\bCIC[:=\-\s]*([A-Z0-9]{9,})\b/,
    ocr: /\bOCR[:=\-\s]*([0-9]{9,13})\b/,
    section: /\bSECCI[OÓ]N[:=\-\s]*([0-9]{3,4})\b/,
  };

  for (const [key, regex] of Object.entries(patterns)) {
    const match = upper.match(regex);
    if (match) result[key] = match[1];
  }

  if (result.curp) result.confidence += 0.15;
  if (result.claveElector) result.confidence += 0.15;
  if (result.section) result.confidence += 0.05;
  return result;
}

export function parseIneOcr(text = '') {
  const raw = normalizeText(text);
  const upper = raw.toUpperCase();
  const result = {
    fullName: '',
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
    curp: '',
    claveElector: '',
    cic: '',
    ocr: '',
    address: '',
    section: '',
    raw,
    source: 'ocr',
    confidence: 0.35,
  };

  const curp = upper.match(/\b([A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d)\b/);
  const clave = upper.match(/\b([A-Z]{6}\d{8}[HM][A-Z]{5}\d{2})\b/);
  const ocr = upper.match(/\b([0-9]{12,13})\b/);
  const section = upper.match(/SECCI[OÓ]N\s*([0-9]{3,4})/);
  const nombre = raw.match(/NOMBRE[:\s]+([A-ZÁÉÍÓÚÑ\s]{8,})/i);
  const domicilio = raw.match(/DOMICILIO[:\s]+([A-Z0-9ÁÉÍÓÚÑ\s,.-]{10,})/i);

  if (curp) {
    result.curp = curp[1];
    result.confidence += 0.15;
  }
  if (clave) {
    result.claveElector = clave[1];
    result.confidence += 0.15;
  }
  if (ocr) {
    result.ocr = ocr[1];
    result.confidence += 0.05;
  }
  if (section) {
    result.section = section[1];
    result.confidence += 0.05;
  }
  if (domicilio) {
    result.address = normalizeText(domicilio[1]);
    result.confidence += 0.05;
  }
  if (nombre) {
    result.fullName = titleCase(nombre[1]);
    result.confidence += 0.1;
  }

  if (!result.fullName) {
    const allCapsName = raw.match(/([A-ZÁÉÍÓÚÑ]{3,}\s+[A-ZÁÉÍÓÚÑ]{3,}\s+[A-ZÁÉÍÓÚÑ\s]{3,})/);
    if (allCapsName) {
      result.fullName = titleCase(allCapsName[1]);
      result.confidence += 0.05;
    }
  }

  return result;
}

export function mergeIdentitySignals({ qrRaw = '', ocrText = '', manual = {} } = {}) {
  const qr = parseIneQr(qrRaw);
  const ocr = parseIneOcr(ocrText);

  const merged = {
    fullName: manual.fullName || qr.fullName || ocr.fullName || '',
    firstName: manual.firstName || qr.firstName || ocr.firstName || '',
    paternalLastName: manual.paternalLastName || qr.paternalLastName || ocr.paternalLastName || '',
    maternalLastName: manual.maternalLastName || qr.maternalLastName || ocr.maternalLastName || '',
    curp: (manual.curp || qr.curp || ocr.curp || '').toUpperCase(),
    claveElector: (manual.claveElector || qr.claveElector || ocr.claveElector || '').toUpperCase(),
    cic: manual.cic || qr.cic || ocr.cic || '',
    ocr: manual.ocr || qr.ocr || ocr.ocr || '',
    address: manual.address || ocr.address || qr.address || '',
    section: manual.section || qr.section || ocr.section || '',
    source: {
      qr: !!qrRaw,
      ocr: !!ocrText,
      manual: Object.values(manual).some(Boolean),
    },
    confidence: Number(Math.min(0.98, Math.max(qr.confidence, ocr.confidence) + (qr.curp && ocr.curp && qr.curp === ocr.curp ? 0.1 : 0))).toFixed(2),
    reviewFlags: [
      !qrRaw ? 'Sin QR leído' : '',
      !ocrText ? 'Sin OCR asistido' : '',
      qr.curp && ocr.curp && qr.curp !== ocr.curp ? 'CURP no coincide entre QR y OCR' : '',
      qr.claveElector && ocr.claveElector && qr.claveElector !== ocr.claveElector ? 'Clave de elector no coincide entre QR y OCR' : '',
    ].filter(Boolean),
  };

  return { qr, ocr, merged };
}
