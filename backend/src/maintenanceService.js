import OpenAI from 'openai';

const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const client = hasOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function heuristicAnalysis(errorLog = '', goal = '') {
  const log = errorLog.toLowerCase();
  const findings = [];
  const patches = [];

  if (log.includes('cors')) {
    findings.push('Hay un problema probable de origen cruzado entre frontend y backend.');
    patches.push('Verifica FRONTEND_URL y la configuración de cors() en el backend.');
  }
  if (log.includes('env') || log.includes('undefined')) {
    findings.push('Hay variables de entorno faltantes o mal cargadas.');
    patches.push('Confirma que el archivo .env exista y que el proceso lea process.env correctamente.');
  }
  if (log.includes('sqlite') || log.includes('database')) {
    findings.push('La base de datos SQLite puede no estar inicializada o la ruta no existe.');
    patches.push('Ejecuta npm run seed y asegúrate de crear el directorio data/.');
  }
  if (log.includes('fetch') || log.includes('network')) {
    findings.push('El frontend podría estar llamando una URL incorrecta o el backend no está arriba.');
    patches.push('Verifica VITE_API_URL y el puerto del backend.');
  }

  if (!findings.length) {
    findings.push('No detecté una firma de error conocida; conviene revisar stack trace completo y último cambio.');
    patches.push('Agrega logs estructurados, revisa el último commit y reproduce el error con datos mínimos.');
  }

  return {
    provider: 'rules',
    summary: `Análisis local para objetivo: ${goal || 'mantenimiento general'}`,
    findings,
    patches,
    caution: 'Esta función propone correcciones, pero no modifica el repositorio de forma autónoma.',
  };
}

export async function analyzeMaintenanceRequest({ errorLog, goal, changedFiles }) {
  if (!client) {
    return heuristicAnalysis(errorLog, goal);
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: `Analiza este error de una app full-stack y responde SOLO JSON con summary, findings, patches, caution.\nObjetivo: ${goal}\nArchivos tocados: ${JSON.stringify(changedFiles || [])}\nError:\n${errorLog}`,
    });
    return { provider: 'openai', ...JSON.parse(response.output_text || '{}') };
  } catch {
    return heuristicAnalysis(errorLog, goal);
  }
}
