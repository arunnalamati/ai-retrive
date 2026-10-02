# Cloud Deployment Guide: Split Cloud Architecture

This guide covers deploying the **AI Knowledge Retrieval and Multi-Agent RAG System** using a **Split Cloud Architecture**:
- **Backend API & Vector Store**: Deployed to **Render** or **Railway** (Dockerized FastAPI + ChromaDB + SentenceTransformers)
- **Frontend SPA**: Deployed to **Vercel** or **Netlify** (Vite + React)

---

## 1. Architecture Overview

```
 ┌─────────────────────────┐          HTTPS (REST / JSON)          ┌───────────────────────────┐
 │   Vercel / Netlify      │  ───────────────────────────────────► │      Render / Railway     │
 │   React 18 + Vite SPA   │                                       │   FastAPI + Uvicorn       │
 │                         │  ◄─────────────────────────────────── │   ChromaDB + SQLite       │
 └─────────────────────────┘       CORS Enabled (VITE_API_BASE_URL) └───────────────────────────┘
```

---

## 2. Part 1: Deploy Backend (Render or Railway)

### Option A: Render (Recommended)

Render provides an automated Blueprint deployment using [`render.yaml`](file:///render.yaml) and the included [`Dockerfile`](file:///Dockerfile).

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your repository. Render will automatically detect [`render.yaml`](file:///render.yaml).
5. (Optional) Under **Environment Variables**, you can set external LLM keys if desired:
   - `LLM_PROVIDER`: `gemini` (or `openai` / `anthropic`)
   - `LLM_API_KEY`: your API key
   - `LLM_MODEL`: model name (e.g., `gemini-1.5-flash`)
   *(If omitted, the built-in safe zero-hallucination extractive engine runs locally with zero API cost!)*
6. Click **Apply**.
7. Once deployed, note your service URL:  
   `https://ai-rag-backend-xxxx.onrender.com`
8. Verify by opening in browser:  
   `https://ai-rag-backend-xxxx.onrender.com/health` (should return `{"status":"ok"}`)

---

### Option B: Railway

1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your repository. Railway automatically detects [`Dockerfile`](file:///Dockerfile) and [`railway.json`](file:///railway.json).
4. Under **Variables**, add:
   - `PORT`: `8000`
   - `CORS_ORIGINS`: `*` (or your Vercel/Netlify URL)
5. Under **Settings** > **Networking**, click **Generate Domain** to get your public backend URL:  
   `https://ai-rag-backend-production.up.railway.app`
6. Test endpoint:  
   `https://ai-rag-backend-production.up.railway.app/health`

---

## 3. Part 2: Deploy Frontend (Vercel or Netlify)

### Option A: Vercel (Recommended)

1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (or leave default if using root [`vercel.json`](file:///vercel.json))
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your live backend URL from Part 1 (e.g., `https://ai-rag-backend-xxxx.onrender.com`)
   *(Do NOT include a trailing slash)*
6. Click **Deploy**.
7. Once complete, your frontend is live at `https://your-project.vercel.app`!

---

### Option B: Netlify

1. Log in to [Netlify Dashboard](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Connect your GitHub repository.
4. Netlify will automatically detect [`netlify.toml`](file:///netlify.toml):
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. In **Environment variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your live backend URL (e.g., `https://ai-rag-backend-xxxx.onrender.com`)
6. Click **Deploy site**.

---

## 4. Part 3: Connect & Configure CORS

Once you have your live frontend URL (e.g., `https://ai-rag-system.vercel.app`):
1. In your **Render** or **Railway** backend settings, update the `CORS_ORIGINS` environment variable:
   ```env
   CORS_ORIGINS=https://ai-rag-system.vercel.app
   ```
   *(Or leave as `*` to allow all origins)*
2. The backend will redeploy or reload with the updated origin restrictions.

---

## 5. Live Verification Checklist

Once both services are deployed, perform these verification checks on the live site:

- [ ] **Header Connection Indicator**: Green dot with `Backend Connected` in the top header.
- [ ] **Health API**: Visit `https://<backend-url>/health` $\rightarrow$ returns `{"status":"ok"}`.
- [ ] **Domain Knowledge Base**: Pre-seeded documents (`College_Library_Policy.txt`, `Hostel_Accommodation_Policy.txt`, `Academic_Examination_Policy.txt`) appear in the Indexed Documents view.
- [ ] **Interactive Query**: Ask `What is the library timing?` $\rightarrow$ receives grounded answer with source provenance.
- [ ] **Document Upload**: Upload a test PDF or TXT file in the Knowledge Base tab and check extraction.
- [ ] **Real-Time Analytics**: Open the **Analytics** view to view query metrics, latency percentiles, and gap detection.
