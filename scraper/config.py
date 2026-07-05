from dotenv import load_dotenv

load_dotenv()

"""
config.py
---------
Sab settings ek hi jagah - taaki thresholds ya feed URLs change karne ho
to poore codebase mein dhundna na pade.
"""

import os

# Teen news sources - RSS feed URLs
RSS_FEEDS = {
    "BBC": "http://feeds.bbci.co.uk/news/rss.xml",
    "NPR": "https://feeds.npr.org/1001/rss.xml",
    "AlJazeera": "https://www.aljazeera.com/xml/rss/all.xml",
}

# MongoDB connection - Node backend isi DB/collections ko Mongoose se padhega.
# Local dev ke liye default localhost, production mein .env se MongoDB Atlas
# ka connection string aayega.
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "newspulse")

# Clustering ke liye thresholds (Option A: keyword overlap)
# Agar 2 articles ke beech >= MIN_SHARED_WORDS common "meaningful" words hain,
# to unhe same cluster mein daal denge.
MIN_SHARED_WORDS = 3

# Article fetch karte waqt timeout (seconds)
REQUEST_TIMEOUT = 12

# Kai news sites bina User-Agent ke request block kar dete hain
USER_AGENT = "Mozilla/5.0 (compatible; NewsPulseBot/1.0; +https://example.com/bot)"

# Common English stopwords - inhe cluster-matching ke waqt ignore karenge
STOPWORDS = set("""
a an the is are was were be been being of in on at to for with by from
and or but if then else when while as it this that these those he she
they we you i his her their our your its not no do does did done have
has had will would can could should shall may might must about into
over after before during between out up down off above below than
so such just also more most other some any all each few more most says
said say new after over year years today world news
""".split())
