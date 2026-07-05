"""
fetch_feeds.py
---------------
RSS feeds se raw entries laate hain aur unhe ek consistent shape mein
normalize karte hain. Alag-alag feeds (BBC, NPR, Al Jazeera) ke field
names/date-formats different hote hain - feedparser library zyadatar
yeh mess khud handle kar leti hai, lekin phir bhi hum extra checks
laga rahe hain taaki missing fields se crash na ho.
"""
from typing import Optional
import feedparser
from datetime import datetime
from time import mktime

from config import RSS_FEEDS


# def normalize_date(entry) -> str | None:
def normalize_date(entry) -> Optional[str]:
    """
    feedparser entries mein date `published_parsed` (a time.struct_time) ke
    form mein aati hai agar successfully parse ho jaye. Kabhi kabhi yeh
    missing hoti hai (bad feed / missing pubDate) - us case mein None return
    karte hain instead of crashing.
    """
    parsed = getattr(entry, "published_parsed", None) or getattr(entry, "updated_parsed", None)
    if not parsed:
        return None
    try:
        dt = datetime.fromtimestamp(mktime(parsed))
        return dt.isoformat()
    except (ValueError, OverflowError):
        return None


# def normalize_entry(entry, source: str) -> dict | None:
def normalize_entry(entry, source: str) -> Optional[dict]:
    """
    Ek raw feedparser entry ko hamare internal schema mein convert karta hai:
    { source, title, summary, link, published_at }

    Kuch feeds 'summary' use karte hain, kuch 'description' - feedparser
    dono ko usually `.summary` mein map kar deta hai, lekin fallback bhi
    rakha hai for safety.
    """
    title = getattr(entry, "title", None)
    link = getattr(entry, "link", None)

    # title ya link na ho to yeh entry useless hai - skip karo
    if not title or not link:
        return None

    summary = getattr(entry, "summary", None) or getattr(entry, "description", "") or ""

    return {
        "source": source,
        "title": title.strip(),
        "summary": summary.strip(),
        "link": link.strip(),
        "published_at": normalize_date(entry),
    }


def fetch_all_feeds() -> list[dict]:
    """
    Sab configured feeds pe loop karta hai, har ek ko parse karta hai,
    aur normalized entries ki ek flat list return karta hai.
    Agar koi ek feed fail ho jaye (network error / bad XML), to poora
    run crash nahi hona chahiye - bas us feed ko skip karke aage badho.
    """
    all_entries = []

    for source, url in RSS_FEEDS.items():
        try:
            parsed_feed = feedparser.parse(url)

            # feedparser 'bozo' flag set karta hai agar feed malformed hai
            if parsed_feed.bozo and not parsed_feed.entries:
                print(f"[WARN] {source}: feed malformed aur koi entries nahi mili, skip.")
                continue

            for entry in parsed_feed.entries:
                normalized = normalize_entry(entry, source)
                if normalized:
                    all_entries.append(normalized)

            print(f"[OK] {source}: {len(parsed_feed.entries)} entries fetched")

        except Exception as e:
            # Kabhi bhi ek feed ki galti se poora scraper nahi girna chahiye
            print(f"[ERROR] {source} fetch failed: {e}")
            continue

    return all_entries
