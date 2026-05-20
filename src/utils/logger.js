/**
 * logger.js — Utilitário de logging estruturado (RNF14).
 *
 * Por que logging estruturado?
 * Ao invés de usar console.log com texto puro, emitimos JSON
 * com campos padronizados (timestamp, level, message, dados extras).
 * Isso facilita filtrar e analisar logs em ferramentas como
 * Grafana, Datadog, ou simplesmente no terminal com jq.
 *
 * Exemplo de saída:
 * {"timestamp":"2026-04-28T19:00:00.000Z","level":"INFO","message":"LLM request","durationMs":2345}
 */

/**
 * Formata e imprime uma linha de log.
 *
 * @param {'INFO'|'WARN'|'ERROR'} level - Nível de severidade.
 * @param {string} message - Mensagem principal do log.
 * @param {object} [data] - Dados extras (serializados em JSON).
 */
function log(level, message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data, // Mescla dados extras diretamente no objeto de log
  };

  // Em produção, poderíamos enviar para uma API de logs.
  // Por ora, imprime em formato JSON no stdout/stderr.
  const output = JSON.stringify(entry);

  if (level === 'ERROR') {
    console.error(output);
  } else {
    console.log(output);
  }
}

const logger = {
  info:  (message, data) => log('INFO',  message, data),
  warn:  (message, data) => log('WARN',  message, data),
  error: (message, data) => log('ERROR', message, data),
};

module.exports = logger;
