# Smart Campus Assistant

AI-powered study assistant that answers questions, summarizes documents, and generates quizzes from uploaded course materials.

## Tech Stack
- **Frontend**: React 18 + Vite + React Router v6 + Tailwind CSS + Zustand + React Query + React Dropzone
- **Backend**: Python + FastAPI
- **Database**: Supabase (Postgres + pgvector)
- **AI**: Groq API (llama-3.1-70b-versatile, mixtral-8x7b-32768, llama-3.1-8b-instant)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Groq API key (set in `backend/.env` as `GROQ_API_KEY=your_key_here`)
- Supabase project (set `SUPABASE_URL` and `SUPABASE_KEY` in `backend/.env`)

### Database Setup
1. Go to your Supabase project SQL Editor
2. Run `backend/schema.sql` to create tables with pgvector
3. Run `backend/match_chunks_function.sql` to create search function
4. See `backend/DATABASE_SETUP.md` for details

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173` (or next available port).

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend will start on `http://localhost:8000`.

**Important**: Install new dependencies with `pip install -r requirements.txt` after pulling updates.

### Verify Upload Works
1. Start both frontend and backend
2. Open frontend URL in browser
3. Navigate to Dashboard
4. Drag and drop PDF/DOCX/PPTX files
5. Uploaded files appear with size info

## Current Status
- ✅ File upload (saves to `backend/uploads/`)
- ✅ Frontend routing and basic UI
- ✅ Backend API structure with routers
- ⏳ Document parsing (PDF/DOCX/PPTX)
- ⏳ RAG pipeline (embeddings + vector search)
- ⏳ Chat with streaming responses
- ⏳ Summary generation with caching
- ⏳ Quiz generation
- ⏳ Supabase integration

## Project Structure
```
frontend/
  src/
    pages/          # Dashboard, Chat, Summaries, Quizzes
    components/     # UploadDropzone
    api/            # API client functions
    store/          # Zustand state management

backend/
  app/
    routers/        # upload, chat, summarize, quiz
    services/       # document, embedding, groq, supabase, storage
    models/         # Pydantic request/response schemas
```

## Next Development Steps
1. Implement document text extraction (PyMuPDF, python-docx, python-pptx)
2. Add sentence-transformers embedding generation
3. Set up Supabase with pgvector for chunk storage
4. Wire RAG retrieval in chat endpoint
5. Add Groq streaming for real-time responses
6. Implement summary caching
7. Build quiz generation with structured JSON output
