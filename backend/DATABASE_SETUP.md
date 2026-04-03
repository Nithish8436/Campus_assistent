# Database Setup

## Step 1: Run Schema Migration

1. Go to Supabase Dashboard: https://sitkpsxbgxgliacwgrto.supabase.co
2. Navigate to: **SQL Editor** (in left sidebar)
3. Create new query and paste contents of `schema.sql`
4. Click **Run** to create all tables

## Step 2: Create Vector Search Function

1. In SQL Editor, create another new query
2. Paste contents of `match_chunks_function.sql`
3. Click **Run** to create the search function

## Verify Setup

Run this query to confirm tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see: `files`, `chunks`, `chat_history`, `summaries`, `quizzes`, `quiz_questions`, `quiz_results`

## Test Vector Search

After uploading a document via the app, test the search function:
```sql
SELECT * FROM match_chunks(
    (SELECT embedding FROM chunks LIMIT 1),
    5
);
```
