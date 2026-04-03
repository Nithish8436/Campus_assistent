-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Files table: stores uploaded document metadata
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    page_count INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks table: stores text chunks with embeddings for RAG
CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Chat history table: stores all conversations
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    file_ids UUID[],
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summaries table: caches generated summaries
CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('detailed', 'bullets', 'simple', 'exam')),
    summary_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(file_id, mode)
);

-- Quizzes table: stores generated quiz metadata
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    file_ids UUID[],
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz questions table: stores individual quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    topic TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz results table: tracks student performance
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table: monitors free actions for members
CREATE TABLE IF NOT EXISTS usage_tracking (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    actions_count INTEGER DEFAULT 0,
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own usage
CREATE POLICY "Users can view own usage" 
ON usage_tracking FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own usage (first time)
CREATE POLICY "Users can insert own usage" 
ON usage_tracking FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own usage
CREATE POLICY "Users can update own usage" 
ON usage_tracking FOR UPDATE 
USING (auth.uid() = user_id);

