"""
clustering.py
--------------
Option A: Keyword / word-overlap grouping.

Idea simple hai:
1. Har article ke title+summary se "meaningful" words nikaalo (lowercase,
   stopwords hatao, punctuation hatao).
2. Do articles ko compare karo - agar unke keyword-sets mein
   MIN_SHARED_WORDS ya usse zyada common words hain, to woh probably
   same story ke baare mein hain.
3. Isko ek Union-Find (chain-matching) tarike se poore article list pe
   apply karo - jaisे jaise groups milte jaate hain, unhe merge karte
   jaate hain.
4. Har group ka label uske sabse common shared words se banate hain.

Yeh production-grade clustering nahi hai (no NLP embeddings), lekin
assessment ke liye yeh perfectly valid, explainable approach hai.
"""

import re
from collections import Counter

from config import MIN_SHARED_WORDS, STOPWORDS


def extract_keywords(text: str) -> set:
    """Text ko lowercase words ke set mein todta hai, stopwords/punctuation hata ke."""
    if not text:
        return set()
    words = re.findall(r"[a-z]+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 2}


def shared_word_count(a: set, b: set) -> int:
    return len(a & b)


class UnionFind:
    """
    Chhota union-find structure - jab article A aur B same cluster mein
    honi chahiye, to unko "union" kar dete hain. Jo articles chain se
    connected hain (A-B match, B-C match) woh sab end mein ek hi group
    mein aa jaate hain, even if A aur C ka direct match kam ho.
    """
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]  # path compression
            x = self.parent[x]
        return x

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx != ry:
            self.parent[ry] = rx


def cluster_articles(articles: list[dict]) -> list[dict]:
    """
    Input: articles list (each dict has 'id', 'title', 'summary', 'body')
    Output: list of clusters, each: { label, article_ids }

    Body text bhi consider karte hain agar available hai (usually
    zyada signal deta hai summary se), lekin title+summary hamesha available
    honge, so unhe base rakha hai.
    """
    if not articles:
        return []

    keyword_sets = []
    for art in articles:
        text = f"{art['title']} {art.get('summary', '')} {art.get('body', '')[:500]}"
        keyword_sets.append(extract_keywords(text))

    n = len(articles)
    uf = UnionFind(n)

    # O(n^2) comparison - assessment-scale data (few hundred articles) ke
    # liye yeh bilkul fine hai. Bade scale pe better indexing chahiye hoga
    # (yeh README mein bhi limitation ke tor pe likhenge).
    for i in range(n):
        for j in range(i + 1, n):
            if shared_word_count(keyword_sets[i], keyword_sets[j]) >= MIN_SHARED_WORDS:
                uf.union(i, j)

    # Group articles by their union-find root
    groups = {}
    for i in range(n):
        root = uf.find(i)
        groups.setdefault(root, []).append(i)

    clusters = []
    for indices in groups.values():
        # Cluster ka label banane ke liye - is group ke sab articles ke
        # keywords ko combine karo, sabse common words nikaalo
        combined = Counter()
        for i in indices:
            combined.update(keyword_sets[i])

        top_words = [w for w, _ in combined.most_common(3)]
        label = " / ".join(top_words) if top_words else "Misc"

        clusters.append({
            "label": label.title(),
            "article_ids": [articles[i]["id"] for i in indices],
        })

    return clusters
