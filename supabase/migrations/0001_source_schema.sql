create extension if not exists vector with schema extensions;

create table if not exists source_documents (
  id uuid primary key default gen_random_uuid(), title text not null, source_url text,
  source_language text not null, document_type text not null, published_at date,
  consolidated_through date, effective_from date, effective_to date, version_label text not null,
  is_verified boolean not null default false, verification_notes text, created_at timestamptz not null default now()
);
create table if not exists rules (
  id uuid primary key default gen_random_uuid(), rule_number text not null unique, title text, part text,
  created_at timestamptz not null default now()
);
create table if not exists rule_versions (
  id uuid primary key default gen_random_uuid(), rule_id uuid not null references rules(id), source_document_id uuid not null references source_documents(id),
  source_rule_number text not null, full_text text not null, source_language text not null, pdf_page_start integer, pdf_page_end integer,
  content_type text not null default 'prose', is_amendment boolean not null default false, effective_from date, effective_to date,
  verified boolean not null default false, created_at timestamptz not null default now(), unique(rule_id, source_document_id)
);
create table if not exists rule_chunks (
  id uuid primary key default gen_random_uuid(), rule_version_id uuid not null references rule_versions(id) on delete cascade,
  source_document_id uuid not null references source_documents(id), rule_number text not null, chunk_index integer not null,
  chunk_text text not null, source_language text not null, pdf_page integer, page_start_offset integer, page_end_offset integer,
  char_start integer, char_end integer, content_type text not null default 'prose',
  search_vector tsvector generated always as (to_tsvector('simple', chunk_text)) stored,
  -- 384 is the documented output size of Supabase's gte-small embedding model.
  embedding extensions.vector(384), embedding_model text, embedding_created_at timestamptz,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(rule_version_id, chunk_index)
);
create index if not exists rule_chunks_search_idx on rule_chunks using gin(search_vector);
create index if not exists rule_chunks_embedding_idx on rule_chunks using hnsw (embedding extensions.vector_cosine_ops);

create or replace function match_rule_chunks(query_embedding extensions.vector(384), match_count integer default 8)
returns table (id uuid, rule_number text, chunk_text text, pdf_page integer, source_document_id uuid, similarity float)
language sql stable
as $$
  select c.id, c.rule_number, c.chunk_text, c.pdf_page, c.source_document_id,
    1 - (c.embedding <=> query_embedding) as similarity
  from rule_chunks c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

alter table source_documents enable row level security;
alter table rules enable row level security;
alter table rule_versions enable row level security;
alter table rule_chunks enable row level security;

drop policy if exists "public can read verified source documents" on source_documents;
create policy "public can read verified source documents" on source_documents for select using (is_verified = true);
drop policy if exists "public can read rules" on rules;
create policy "public can read rules" on rules for select using (true);
drop policy if exists "public can read verified rule versions" on rule_versions;
create policy "public can read verified rule versions" on rule_versions for select using (verified = true);
drop policy if exists "public can read verified rule chunks" on rule_chunks;
create policy "public can read verified rule chunks" on rule_chunks for select using (
  exists (select 1 from rule_versions v where v.id = rule_chunks.rule_version_id and v.verified = true)
);
