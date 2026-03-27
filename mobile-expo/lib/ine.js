export function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
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
    stateCode: '',
    raw,
    source: 'qr',
  };

  const patterns = {
    curp: /([A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d)/,
    claveElector: /([A-Z]{6}\d{8}[HM][A-Z]{5}\d{2})/,
    cic: /CIC[:=\-\s]*([A-Z0-9]{9,})/,
    ocr: /OCR[:=\-\s]*([0-9]{9,13})/,
    section: /SECCI[OÓ]N[:=\-\s]*([0-9]{3,4})/,
  };

  for (const [key, regex] of Object.entries(patterns)) {
    const match = upper.match(regex);
    if (match) result[key] = match[1];
  }

  const normalized = raw
    .replace(/[|;]/g, '
')
    .split(/
+/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const line of normalized) {
    const [k, ...rest] = line.split(/[:=]/);
    if (!rest.length) continue;
    const key = normalizeText(k).toUpperCase();
    const value = normalizeText(rest.join(':'));
    if (/NOMBRE/.test(key) && !/DOMICILIO/.test(key)) result.fullName = titleCase(value);
    if (/APELLIDO PATERNO/.test(key)) result.paternalLastName = titleCase(value);
    if (/APELLIDO MATERNO/.test(key)) result.maternalLastName = titleCase(value);
    if (/NOMBRE\(S\)|NOMBRES|NOMBRE/.test(key) && !/COMPLETO/.test(key)) result.firstName = titleCase(value);
    if (/CURP/.test(key)) result.curp = value.toUpperCase();
    if (/CLAVE/.test(key)) result.claveElector = value.toUpperCase();
    if (/DOMICILIO|DIRECCI[OÓ]N/.test(key)) result.address = value;
    if (/SECCI[OÓ]N/.test(key)) result.section = value;
    if (/ESTADO/.test(key)) result.stateCode = value;
    if (/OCR/.test(key)) result.ocr = value;
    if (/CIC/.test(key)) result.cic = value;
  }

  if (!result.fullName) {
    const nameMatch = raw.match(/([A-ZÁÉÍÓÚÑ]+)\s+([A-ZÁÉÍÓÚÑ]+)\s+([A-ZÁÉÍÓÚÑ\s]{3,})/i);
    if (nameMatch) {
      result.paternalLastName = titleCase(nameMatch[1]);
      result.maternalLastName = titleCase(nameMatch[2]);
      result.firstName = titleCase(nameMatch[3]);
      result.fullName = titleCase(`${nameMatch[3]} ${nameMatch[1]} ${nameMatch[2]}`);
    }
  }

  if (!result.fullName) {
    result.fullName = titleCase([result.firstName, result.paternalLastName, result.maternalLastName].filter(Boolean).join(' '));
  }

  return result;
}
