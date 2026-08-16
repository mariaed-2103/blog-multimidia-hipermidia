-- Schema do banco de dados do blog
-- Rode este arquivo uma vez no seu banco PostgreSQL para criar a tabela.
-- Exemplo: psql -U seu_usuario -d nome_do_banco -f schema.sql

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  introducao TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  autoria TEXT NOT NULL DEFAULT 'Ambas', -- 'Maria Eduarda' | 'Júlia' | 'Ambas'
  capa TEXT,                              -- URL da imagem de capa
  video1 TEXT,                            -- link do vídeo 1 (ex: YouTube)
  video2 TEXT,                            -- link do vídeo 2 (ex: YouTube)
  links_midia JSONB NOT NULL DEFAULT '[]',        -- [{ "titulo": "...", "url": "..." }]
  links_multimidia JSONB NOT NULL DEFAULT '[]',
  links_hipermidia JSONB NOT NULL DEFAULT '[]',
  imagens JSONB NOT NULL DEFAULT '[]',    -- ["url1", "url2", ...]
  audio TEXT,                             -- URL do áudio/podcast
  fontes TEXT,                            -- tipografias usadas no projeto
  referencias TEXT NOT NULL,              -- bibliografia / créditos das fontes de informação e imagens
  criado_em TIMESTAMP NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_data ON posts (data DESC);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'Geral';

ALTER TABLE posts ADD COLUMN IF NOT EXISTS grupos_links JSONB NOT NULL DEFAULT '[]';

UPDATE posts SET grupos_links = (
  SELECT jsonb_agg(grupo) FROM (
    SELECT jsonb_build_object('titulo', 'Mídia', 'links', links_midia) AS grupo
    WHERE jsonb_array_length(links_midia) > 0
    UNION ALL
    SELECT jsonb_build_object('titulo', 'Multimídia', 'links', links_multimidia)
    WHERE jsonb_array_length(links_multimidia) > 0
    UNION ALL
    SELECT jsonb_build_object('titulo', 'Hipermídia', 'links', links_hipermidia)
    WHERE jsonb_array_length(links_hipermidia) > 0
  ) sub
);
UPDATE posts SET grupos_links = '[]' WHERE grupos_links IS NULL;

ALTER TABLE posts DROP COLUMN IF EXISTS links_midia;
ALTER TABLE posts DROP COLUMN IF EXISTS links_multimidia;
ALTER TABLE posts DROP COLUMN IF EXISTS links_hipermidia;