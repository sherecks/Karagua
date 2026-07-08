-- Schema do Postgres no Railway (a API também cria isso sozinha no boot).
-- Rodar manualmente se quiser: Railway → Postgres service → Data/Query.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pontos_interesse (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text        NOT NULL,
  latitude    float8      NOT NULL,
  longitude   float8      NOT NULL,
  dados       text        NOT NULL DEFAULT '',
  tipo        text        NOT NULL DEFAULT 'monitoramento',
  created_at  timestamptz NOT NULL DEFAULT now()
);
