export function buildIdentityReview(identity = {}) {
  const warnings = [];
  const normalized = {
    fullName: String(identity.fullName || '').trim(),
    curp: String(identity.curp || '').trim().toUpperCase(),
    claveElector: String(identity.claveElector || '').trim().toUpperCase(),
    address: String(identity.address || '').trim(),
    section: String(identity.section || '').trim(),
    sourceConfidence: Number(identity.confidence || 0),
    reviewFlags: Array.isArray(identity.reviewFlags) ? identity.reviewFlags : [],
  };

  if (!normalized.fullName) warnings.push('Falta nombre completo');
  if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(normalized.curp)) warnings.push('CURP con formato dudoso');
  if (!/^[A-Z]{6}\d{8}[HM][A-Z]{5}\d{2}$/.test(normalized.claveElector)) warnings.push('Clave de elector con formato dudoso');
  if (!normalized.address) warnings.push('Falta domicilio');
  if (!normalized.section) warnings.push('Falta sección');
  if (normalized.sourceConfidence < 0.7) warnings.push('Confianza global baja');

  const score = Math.max(0, 100 - warnings.length * 12 - (normalized.reviewFlags.length * 8));
  return {
    score,
    warnings,
    recommendation: score >= 80 ? 'Apto para confirmar' : score >= 60 ? 'Requiere revisión visual' : 'Requiere captura manual complementaria',
    normalized,
  };
}
