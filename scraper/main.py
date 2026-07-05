"""
main.py
-------
Poore pipeline ka entry point. Yeh script:
1. Sab RSS feeds fetch karta hai
2. Naye articles (jo pehle se DB mein nahi hain) ke liye full body extract karta hai
3. Sabko DB mein save karta hai (duplicates automatically skip ho jaate hain)
4. Unclustered articles pe clustering chalata hai aur cluster assignment save karta hai

Run karo: python main.py
Node backend isi script ko subprocess ke through trigger karega
(POST /ingest/trigger endpoint se).
"""

import sys

from db import (
    init_db,
    article_exists,
    insert_article,
    # fetch_unclustered_articles,
    fetch_all_articles,
    create_cluster,
    assign_cluster,
    reset_clusters,
)
from fetch_feeds import fetch_all_feeds
from extract_article import extract_body
from clustering import cluster_articles


def run_pipeline():
    print("=== News Pulse Pipeline Start ===")

    init_db()

    # Step 1: RSS feeds se raw entries lao
    entries = fetch_all_feeds()
    print(f"Total entries fetched from feeds: {len(entries)}")

    # Step 2: Naye articles ko filter karo (re-runnable: purane skip karo)
    new_entries = [e for e in entries if not article_exists(e["link"])]
    print(f"New articles to process: {len(new_entries)}")

    # Step 3: Har naye article ke liye full body nikaalo aur DB mein daalo
    for entry in new_entries:
        body = extract_body(entry["link"])
        entry["body"] = body
        insert_article(entry)

    print("New articles saved to DB.")

    # Step 4: Clustering - har run pe sab articles ko fresh se re-cluster
    # karte hain (kyunki naye articles se grouping badal sakti hai)
    reset_clusters()
    all_articles = fetch_all_articles()

    if not all_articles:
        print("No articles in DB, skipping clustering.")
        return

    clusters = cluster_articles(all_articles)
    print(f"Formed {len(clusters)} clusters.")

    for cluster in clusters:
        cluster_id = create_cluster(cluster["label"])
        for article_id in cluster["article_ids"]:
            assign_cluster(article_id, cluster_id)

    print("=== Pipeline Complete ===")


if __name__ == "__main__":
    try:
        run_pipeline()
    except Exception as e:
        # Node backend is exit code / stderr ko dekh ke job ko "failed" mark karega
        print(f"[FATAL] Pipeline crashed: {e}", file=sys.stderr)
        sys.exit(1)
