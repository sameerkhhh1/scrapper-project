# News Pulse — Topic-Clustered News Timeline

Full-stack app: Python scraper (RSS ingestion + clustering) → Node/Express
API (MongoDB) → React (Vite) timeline UI.

## Folder Structure

```
news-pulse/
├── scraper/          # Python: fetch RSS, extract articles, cluster by topic
│   ├── config.py
│   ├── db.py          # MongoDB read/write
│   ├── fetch_feeds.py  # RSS fetch + normalize
│   ├── extract_article.py  # full article body scraping
│   ├── clustering.py   # keyword-overlap topic grouping
│   ├── main.py          # pipeline entry point
│   └── requirements.txt
│
├── backend/           # Node + Express, 4-layer architecture
│   ├── server.js
│   ├── config/db.js
│   ├── models/         # Mongoose schemas (Article, Cluster, Job)
│   ├── services/        # business logic (DB queries, subprocess spawn)
│   ├── controllers/      # HTTP request/response handling
│   ├── routes/            # URL -> controller mapping
│   └── .env.example
│
└── frontend/           # React (Vite)
    ├── src/
    │   ├── components/    # Timeline, ClusterDetail, SourceFilter, RefreshButton
    │   ├── services/api.js  # all backend calls centralized here
    │   ├── App.jsx
    │   └── main.jsx
    └── .env.example
```

## Setup

### 1. MongoDB
Local MongoDB chalao (`mongod`) ya MongoDB Atlas free tier ka connection
string le lo.

### 2. Scraper
```bash
cd scraper
pip install -r requirements.txt
# .env / env vars set karo: MONGO_URI, MONGO_DB_NAME (ya defaults use karo)
python main.py
```
Isse RSS feeds fetch honge, articles MongoDB mein save honge, aur clustering
chalegi. Backend isi script ko subprocess se bhi trigger kar sakta hai.

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env    # values fill karo
npm run dev              # nodemon se, ya `npm start`
```
Server `http://localhost:5000` pe chalega.

### 4. Frontend
```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_BASE_URL set karo
npm run dev
```
App `http://localhost:5173` pe chalega.

## Architecture Overview

- **Scraper (Python)**: RSS feeds ko `feedparser` se fetch karta hai, teeno
  feeds ke inconsistent field-names/date-formats ko ek common schema mein
  normalize karta hai. Har naye article ke liye `trafilatura` se full body
  extract karta hai (failure-safe — koi bhi ek page fail ho to poora run
  crash nahi hota). Duplicates MongoDB ke unique index (`link` field) se
  automatically skip ho jaate hain, isliye script re-runnable hai.

- **Clustering approach**: Keyword/word-overlap grouping (Option A) use
  kiya hai. Reason: dataset chhota hai (kuch sau articles), aur is scale pe
  simple approach reliable results deta hai bina extra ML dependencies ke.
  Har article ke title+summary+body(partial) se stopwords hata ke meaningful
  keywords nikalte hain; do articles agar >= 3 keywords share karte hain to
  unhe same cluster mein group kar dete hain (chain-matching via union-find).
  Cluster ka label uske top-3 most common shared keywords se banta hai.
  **Threshold (3 shared words)** experiment se choose kiya — 2 bahut zyada
  false-positive clusters bana raha tha (unrelated articles bhi merge ho
  rahe the), 4+ bahut strict tha (related stories split ho rahi thi).

  **Limitation**: yeh approach purely lexical hai — agar do articles same
  event ke baare mein hain lekin bilkul different words use karte hain
  (paraphrasing / different language style), to woh cluster nahi honge.
  TF-IDF/embeddings-based approach isse better handle karega lekin zyada
  compute/dependencies chahiye.

- **Backend (Node/Express)**: 4-layer architecture — `routes` (URL mapping)
  → `controllers` (HTTP handling, validation, status codes) → `services`
  (business logic, DB queries) → `models` (Mongoose schemas). `/ingest/trigger`
  Python scraper ko background subprocess ke through chalata hai aur turant
  jobId return karta hai (202 Accepted); frontend `/ingest/status/:jobId`
  poll karke pata karta hai.

- **Frontend (React + Vite)**: `services/api.js` mein sab API calls
  centralized hain. `Timeline` component recharts ke horizontal stacked
  bar-chart trick se Gantt-jaisa timeline banata hai (invisible "base" bar +
  visible "duration" bar). Cluster click -> side panel mein full article
  list. Source filter client-side hai (cluster-level source list backend se
  aati hai).

## News Sources Used
- BBC News — http://feeds.bbci.co.uk/news/rss.xml
- NPR — https://feeds.npr.org/1001/rss.xml
- Al Jazeera — https://www.aljazeera.com/xml/rss/all.xml

## Deployment Notes
- **Frontend** → Vercel/Netlify (`npm run build`, output = `dist/`)
- **Backend** → Render/Railway (env vars set karo: `MONGO_URI`, `PORT`,
  `PYTHON_SCRIPT_PATH`, `PYTHON_EXECUTABLE`, `FRONTEND_URL`)
- **Scraper** → Render/Railway pe backend ke saath hi deploy karo (Python
  runtime available honi chahiye), ya GitHub Actions cron se schedule karo
- **Database** → MongoDB Atlas free tier

## Known Assumptions (per assessment instructions)
- Cross-source story merging (stretch goal) implement nahi kiya — noted as
  a known hard problem in the assessment itself.
- Auto-refresh polling frontend mein implement nahi kiya (manual "Refresh
  data" button hai, jo required feature hai); auto-poll ek stretch goal tha.
