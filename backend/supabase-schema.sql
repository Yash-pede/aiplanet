-- ==============================
-- CLEANUP
-- ==============================
drop table if exists public.chat_messages cascade;
drop table if exists public.chat_sessions cascade;
drop table if exists public.document_chunks cascade;
drop table if exists public.documents cascade;
drop table if exists public.workflows cascade;

-- ==============================
-- WORKFLOWS
-- ==============================
create table if not exists public.workflows (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
    name text not null,
    description text,
    definition jsonb, -- stores workflow graph/config
    created_at timestamptz default timezone('utc'::text, now()),
    updated_at timestamptz default timezone('utc'::text, now()),
    status text check (status in ('pending','completed','in_progress', 'failed')) default 'pending'
);

create index idx_workflows_user_id on public.workflows(user_id);

-- ==============================
-- DOCUMENTS
-- ==============================
create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    workflow_id uuid references public.workflows (id) on delete cascade,
    user_id uuid references auth.users (id) on delete cascade,
    file_name text not null,
    file_url text not null,
    status text check (status in ('pending','processed','in_progress', 'failed')) default 'pending',
    created_at timestamptz default timezone('utc'::text, now())
);

create index idx_documents_user_id on public.documents(user_id);
create index idx_documents_workflow_id on public.documents(workflow_id);

-- ==============================
-- DOCUMENT CHUNKS
-- ==============================
create table if not exists public.document_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references public.documents (id) on delete cascade,
    workflow_id uuid references public.workflows (id) on delete cascade,
    chunk_index int not null,
    content text not null,
    created_at timestamptz default timezone('utc'::text, now()),
    constraint ux_documents_workflow unique (workflow_id) 
);
create unique index if not exists ux_documents_workflow
  on public.documents (workflow_id);

create index idx_chunks_document_id on public.document_chunks(document_id);
create index idx_chunks_workflow_id on public.document_chunks(workflow_id);

-- ==============================
-- CHAT SESSIONS
-- ==============================
create table if not exists public.chat_sessions (
    id uuid primary key default gen_random_uuid(),
    workflow_id uuid references public.workflows (id) on delete cascade,
    user_id uuid references auth.users (id) on delete cascade,
    title text null,
    created_at timestamptz default timezone('utc'::text, now()),
    updated_at timestamptz default timezone('utc'::text, now()),
    metadata jsonb
);

-- Optimized: quickly fetch all sessions for a user
create index idx_sessions_user_id on public.chat_sessions(user_id);
create index idx_sessions_workflow_id on public.chat_sessions(workflow_id);

-- ==============================
-- CHAT MESSAGES
-- ==============================
create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.chat_sessions (id) on delete cascade,
    role text check (role in ('user','system','assistant')) not null,
    message text,
    metadata jsonb,
    created_at timestamptz default timezone('utc'::text, now())
);

-- Optimized for fast chat retrieval
create index idx_messages_session_id on public.chat_messages(session_id);
create index idx_messages_created_at on public.chat_messages(created_at);
