# Source detection

Order of checks in `Score Articles`:

1. `guid` or `link` contains `lobste.rs` → **Lobsters**
2. `comments` URL contains `lobste.rs` → **Lobsters**
3. `categories` present (Lobste.rs RSS tags) + no HN objectID → **Lobsters**
4. `news.google.com` in link/guid → **GoogleNews**
5. `objectID` or `points` defined → **HackerNews**
6. fallback → **RSS**

## Why
Lobste.rs items often expose the article URL on a third-party domain; the Lobste.rs identity lives in `guid` / `comments`.
