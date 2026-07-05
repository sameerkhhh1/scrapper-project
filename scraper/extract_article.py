"""
extract_article.py
--------------------
RSS feed sirf headline + short summary deta hai. Yahan hum actual
article page pe jaake full body text nikaalte hain, using trafilatura
(yeh library BeautifulSoup se better hai boilerplate - ads, nav, footer -
remove karne mein).

Kai pages fail honge (paywall, weird HTML, timeout) - un cases mein hum
bas empty string return karte hain, crash nahi karte. Body na milne pe
bhi hum headline+summary se hi clustering kar sakte hain, so it's fine.
"""

import requests
import trafilatura

from config import REQUEST_TIMEOUT, USER_AGENT


def extract_body(url: str) -> str:
    """
    Best-effort full-article extraction.
    Returns "" (empty string) on any failure - never raises.
    """
    try:
        response = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()

        text = trafilatura.extract(response.text)
        return text.strip() if text else ""

    except requests.exceptions.RequestException as e:
        print(f"[WARN] Article fetch failed for {url}: {e}")
        return ""
    except Exception as e:
        # trafilatura ya kisi aur cheez se koi bhi unexpected error - ignore karo
        print(f"[WARN] Article parse failed for {url}: {e}")
        return ""
