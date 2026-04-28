-- ============================================================
-- Script para criar a tabela CONVERSAS no Oracle Database.
--
-- Essa tabela armazena APENAS a última conversa de cada
-- usuário (RF12 do documento de requisitos).
--
-- A coluna MENSAGENS é do tipo CLOB e guarda um JSON array
-- com todas as mensagens da conversa, no formato:
-- [
--   { "role": "user",      "content": "...", "timestamp": "..." },
--   { "role": "assistant", "content": "...", "timestamp": "..." }
-- ]
--
-- O índice UNIQUE em USUARIO_EMAIL garante que cada usuário
-- tenha no máximo 1 registro (1 conversa).
-- ============================================================

CREATE TABLE FERNANDO.CONVERSAS (
    CODIGO         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    USUARIO_EMAIL  VARCHAR2(255) NOT NULL,
    MENSAGENS      CLOB NOT NULL,
    CRIADO_EM      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ATUALIZADO_EM  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice UNIQUE: garante que só exista 1 conversa por usuário.
-- Se o usuário já tiver uma conversa, fazemos UPDATE (não INSERT).
CREATE UNIQUE INDEX FERNANDO.IDX_CONV_USUARIO
    ON FERNANDO.CONVERSAS(USUARIO_EMAIL);
