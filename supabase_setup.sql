-- Execute este SQL no painel de controle do Supabase para configurar a memória vetorial

-- Habilitar a extensão pgvector
create extension if not exists vector;

-- Criar a tabela de memórias
create table if not exists kortex_memories (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(768), -- 768 para text-embedding-004 do Google
  created_at timestamp with time zone default now()
);

-- Criar função de busca por similaridade
create or replace function match_memories (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kortex_memories.id,
    kortex_memories.content,
    kortex_memories.metadata,
    1 - (kortex_memories.embedding <=> query_embedding) as similarity
  from kortex_memories
  where 1 - (kortex_memories.embedding <=> query_embedding) > match_threshold
  order by kortex_memories.embedding <=> query_embedding
  limit match_count;
end;
$$;
