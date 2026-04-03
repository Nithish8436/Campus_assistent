# Smart Campus Assistant - Complete Setup Guide

## What I Just Implemented

### ✅ Complete RAG Pipeline
1. **Document Processing**: Extracts text from PDF/DOCX/PPTX files
2. **Text Chunking**: Splits documents into ~800 token chunks with 150 token overlap
3. **Embeddings**: Generates 384-dimensional vectors using `sentence-transformers`
4. **Vector Storage**: Stores chunks + embeddings in Supabase with pgvector
5. **Semantic Search**: Finds relevant chunks using cosine similarity
6. **AI Chat**: Uses Groq API to answer questions based on retrieved context

### ✅ Frontend Features
- Upload documents with drag & drop
- View all uploaded files from database
- Select files for chat by clicking them
- Interactive chat interface
- Real-time responses

### ✅ Backend Features
- `/api/upload` - Uploads, processes, chunks, embeds, and stores documents
- `/api/upload/files` - Lists all uploaded files
- `/api/chat` - RAG-powered Q&A with streaming responses

---

## 🚀 Quick Start (3 Steps)

### Step 1: Set Up Supabase Database

1. Open **Supabase Dashboard**: https://sitkpsxbgxgliacwgrto.supabase.co
2. Go to **SQL Editor** (left sidebar)
3. Create a new query and paste **all contents** from `backend/schema.sql`
4. Click **Run** ▶️
5. Create another query, paste contents from `backend/match_chunks_function.sql`
6. Click **Run** ▶️

**Verify**: Run this query to check:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```
You should see: `files`, `chunks`, `chat_history`, `summaries`, etc.

### Step 2: Install Dependencies & Restart Backend

**Kill the current backend terminal** (if running), then:
```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

This installs:
- `sentence-transformers` (embedding model)
- `PyMuPDF`, `python-docx`, `python-pptx` (document parsing)
- `python-dotenv` (env variable loading)

**Wait ~1-2 minutes** on first run while sentence-transformers downloads the model (~80MB).

### Step 3: Test the Full Flow

1. **Frontend is already running** at `http://localhost:5174`
2. Go to **Dashboard
**
3. Upload the PDF you already have (`927fe1f1b27f4a0aaa7ca6a3e8708c30.pdf`)
4. **Wait for upload** - you'll see "Uploading and processing..." while it:
   - Extracts text
   - Chunks it
   - Generates embeddings
   - Stores in Supabase
5. **Click the file** in your library to select it
6. Go to **Chat** page
7. Ask: "What is this document about?"
8. Get an AI answer based on the actual content!

---

## 🔧 Troubleshooting

### "Failed to fetch files"
- Backend not running or crashed
- Check terminal for Python errors
- Verify `.env` has correct Supabase credentials

### "No chunks found" / "Couldn't find relevant information"
- Database tables not created (run schema.sql)
- File wasn't processed (check backend logs during upload)
- Search function not created (run match_chunks_function.sql)

### Backend crashes on upload
- Missing dependencies: run `pip install -r requirements.txt`
- Check backend terminal for specific error

### Slow first upload
- Normal! sentence-transformers downloads model on first run (~80MB)
- Subsequent uploads are fast

---

## 📁 Project File Structure

```
backend/
  app/
    routers/
      upload.py          ← Upload + RAG processing
      chat.py            ← Q&A with retrieval
    services/
      document_service.py ← Text extraction + chunking
      embedding_service.py ← Vector generation
      supabase_service.py  ← Database client
      groq_service.py      ← AI completions
      storage_service.py   ← Local file storage
    models/              ← Request/response schemas
  .env                   ← API keys (Groq + Supabase)
  schema.sql            ← Database schema with pgvector
  match_chunks_function.sql ← Vector search function
  DATABASE_SETUP.md     ← Detailed DB setup guide

frontend/
  src/
    pages/
      Dashboard.jsx     ← File upload + library
      Chat.jsx          ← Interactive Q&A
    api/
      uploadApi.js      ← File upload calls
      chatApi.js        ← Chat + file list API
    store/
      useAppStore.js    ← Selected file IDs state
```

---

## ✨ What Works Now

### 1. Upload Flow
Upload → Extract text → Chunk → Embed → Store in Supabase

### 2. Chat Flow
Question → Convert to embedding → Search similar chunks → Send to Groq → Get answer

### 3. File Management
View all files → Click to select → Use in chat

---

## 🚧 What's Still Placeholder

- **Summaries**: Not implemented yet
- **Quizzes**: Not implemented yet
- **User Authentication**: Using mock user ID
- **Chat History Persistence**: Not saved yet
- **Streaming Responses**: Returns full text (can be upgraded)

---

## 🎯 Next Development Priorities

1. **Summary Generation** - Use full document context + Groq
2. **Quiz Builder** - Structured JSON output from Groq
3. **Chat History** - Save conversations to database
4. **File Deletion** - Remove files + chunks
5. **Multi-file Chat** - Query across multiple documents

Let me know which feature you want next!
