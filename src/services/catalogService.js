/**
 * catalogService.js — Enriquecimento de recomendações via Google Books API (RIA04).
 *
 * Após o Gemini gerar as recomendações, este serviço busca na
 * Google Books API informações adicionais sobre cada obra:
 *   - URL da capa (thumbnail)
 *   - Sinopse (description)
 *   - Data de publicação
 *
 * A Google Books API é gratuita para buscas básicas (sem API key),
 * com limite de ~1000 requisições/dia. Com API key, o limite aumenta.
 *
 * Documentação: https://developers.google.com/books/docs/v1/reference/volumes/list
 */

const env = require('../config/env');
const logger = require('../utils/logger');

// Tempo máximo para esperar resposta da API (ms)
const TIMEOUT_MS = 5000;

/**
 * Busca dados de enriquecimento para uma obra na Google Books API.
 *
 * @param {object} rec - Recomendação do Gemini {title, author, type, ...}
 * @returns {object} Recomendação enriquecida com coverUrl, synopsis e publishedDate.
 */
async function enrichOne(rec) {
  try {
    // Monta a query de busca com título + autor (quando disponível)
    const query = [rec.title, rec.author].filter(Boolean).join(' ');
    const encodedQuery = encodeURIComponent(query);

    // Monta a URL com ou sem API key
    const keyParam = env.googleBooksApiKey ? `&key=${env.googleBooksApiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=1${keyParam}`;

    // Usa AbortController para timeout — evita que uma API lenta trave o chat
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn('Google Books API retornou erro', { status: response.status, title: rec.title });
      // Retorna campos nulos para manter schema consistente (não lança erro)
      return { ...rec, coverUrl: null, synopsis: null, publishedDate: null };
    }

    const data = await response.json();

    // Se não encontrou resultados, retorna com campos nulos (garante schema consistente)
    if (!data.items || data.items.length === 0) {
      return { ...rec, coverUrl: null, synopsis: null, publishedDate: null };
    }

    const info = data.items[0].volumeInfo;

    // Adiciona os campos de enriquecimento à recomendação original
    return {
      ...rec,
      // Thumbnail em HTTPS (a API retorna HTTP por padrão)
      coverUrl:      info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
      // Trunca a sinopse em 500 caracteres para não sobrecarregar a resposta
      synopsis:      info.description ? info.description.substring(0, 500) : null,
      publishedDate: info.publishedDate || null,
    };
  } catch (err) {
    // Em caso de erro (timeout, rede, etc.), loga e retorna com campos nulos (RNF12)
    if (err.name === 'AbortError') {
      logger.warn('Google Books API timeout', { title: rec.title });
    } else {
      logger.warn('Erro ao enriquecer recomendação', { title: rec.title, error: err.message });
    }
    return { ...rec, coverUrl: null, synopsis: null, publishedDate: null };
  }
}

/**
 * Enriquece todas as recomendações em paralelo.
 * Usa Promise.allSettled para garantir que uma falha não cancele as outras.
 *
 * @param {Array} recommendations
 * @returns {Array} Recomendações enriquecidas (com fallback nas que falharem).
 */
async function enrichRecommendations(recommendations) {
  if (!recommendations || recommendations.length === 0) return [];

  const start = Date.now();

  // Promise.allSettled garante que todos os itens são processados,
  // mesmo que algumas buscas falhem individualmente.
  const results = await Promise.allSettled(
    recommendations.map((rec) => enrichOne(rec))
  );

  const enriched = results.map((result, i) =>
    result.status === 'fulfilled' ? result.value : recommendations[i]
  );

  logger.info('Enriquecimento concluído', {
    total: recommendations.length,
    durationMs: Date.now() - start,
  });

  return enriched;
}

module.exports = {
  enrichRecommendations,
};
