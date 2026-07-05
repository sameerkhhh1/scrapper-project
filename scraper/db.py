"""
db.py
-----
Sab MongoDB logic yahan hai - collections, insert, dedupe-check, cluster save.
Do collections use kar rahe hain:
  - "articles": har scraped article ek document
  - "clusters": har topic-group ek document (label + article refs)
  - "jobs": ingestion run ka status track karne ke liye (Node API isko poll karega)

Node backend (Mongoose) isi database aur collection names ko read karega,
isliye field names (source, title, summary, body, link, publishedAt, clusterId)
dono taraf same rakhe hain.
"""

from pymongo import MongoClient, ASCENDING
from bson.objectid import ObjectId

from config import MONGO_URI, MONGO_DB_NAME

_client = None


def get_db():
    """Singleton-style connection - ek hi client poore script mein reuse hota hai."""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client[MONGO_DB_NAME]


def init_db():
    """
    Indexes bana deta hai agar already nahi hain.
    'link' pe unique index hi hamari dedupe strategy hai - same link
    dobara insert karne ki koshish silently ignore ho jaayegi.
    """
    db = get_db()
    db.articles.create_index([("link", ASCENDING)], unique=True)


def article_exists(link: str) -> bool:
    """Re-runnable scraping ke liye - agar link already DB mein hai to skip karo."""
    db = get_db()
    return db.articles.find_one({"link": link}) is not None


def insert_article(article: dict):
    """
    article dict expected keys: source, title, summary, body, link, published_at
    Unique index ki wajah se duplicate insert error dega - hum usko
    try/except se silently ignore kar dete hain (upsert jaisa behaviour).
    """
    db = get_db()
    doc = {
        "source": article["source"],
        "title": article["title"],
        "summary": article.get("summary", ""),
        "body": article.get("body", ""),
        "link": article["link"],
        "publishedAt": article.get("published_at"),
        "clusterId": None,
    }
    try:
        db.articles.insert_one(doc)
    except Exception:
        # duplicate key error (link already exists) - safe to ignore
        pass


def fetch_all_articles() -> list[dict]:
    db = get_db()
    docs = list(db.articles.find())
    for d in docs:
        d["id"] = str(d["_id"])  # clustering.py string ids expect karta hai
    return docs


def create_cluster(label: str) -> str:
    db = get_db()
    result = db.clusters.insert_one({"label": label})
    return str(result.inserted_id)


def assign_cluster(article_id: str, cluster_id: str):
    db = get_db()
    db.articles.update_one(
        {"_id": ObjectId(article_id)},
        {"$set": {"clusterId": ObjectId(cluster_id)}},
    )


def reset_clusters():
    """
    Har run pe purane clusters delete karke naye sirey se banate hain
    (kyunki naye articles aane se grouping badal sakti hai).
    Articles delete nahi hote, sirf clusterId reset hota hai.
    """
    db = get_db()
    db.articles.update_many({}, {"$set": {"clusterId": None}})
    db.clusters.delete_many({})
