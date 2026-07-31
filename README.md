# CSG Celebrate

Instagram-style internal social for CSG employees — celebrations, wins, events, and culture.

**Stack:** Vite + React + TypeScript · Firebase Auth / Firestore / Storage · GitHub Pages

**Auth gate:** `@csgi.com` and `@csg.com` emails only. Do **not** reuse the fitness (`wow-csg`) Firebase project — create a **new** project to avoid Spark quota collisions.

## Phases included

1. **MVP feed** — profiles, photo posts (1–10, compressed), home feed, likes, comments, bottom nav  
2. **Social + Stories** — follow/unfollow, following-first feed, 24h Stories tray/viewer, activity notifications  
3. **Explore + Reels** — search people/hashtags, trending grid, short video (≤60s) vertical viewer  
4. **DMs** — 1:1 conversations with realtime listeners, optional image in chat, unread badges  

## Setup

See **[SETUP.md](SETUP.md)** for the full Firebase + GitHub Pages checklist.

```bash
cd csg-celebrate
npm install
cp .env.example .env.local
# fill Firebase web config, then:
npm run dev
```

1. Create a **new** Firebase project (`csg-celebrate` — not `wow-csg`).
2. Enable Email/Password Auth, Firestore, and Storage.
3. Deploy rules: `npx firebase-tools deploy --only firestore,storage`
4. Prefer **Blaze** before company-wide traffic.

## Build & GitHub Pages

Default base path is `/csg-celebrate/`. Push to `main` runs `.github/workflows/deploy-pages.yml`.

Expected URL (after repo + secrets + Pages enabled):

https://csg-international-wow-csg.github.io/csg-celebrate/

```bash
npm run build
```

Add the six `VITE_FIREBASE_*` values as GitHub Actions secrets (see SETUP.md). Build also copies `404.html` for SPA deep links.

## Admin moderation

Accounts `wow-csg@csgi.com` and `admin@csgi.com` can hide/delete posts via security rules. Profile owners can hide/delete their own posts from the profile screen.

## Collections

| Collection | Purpose |
|---|---|
| `users` | Profiles |
| `posts` / `postLikes` / `comments` | Feed |
| `follows` | Social graph |
| `stories` | 24h stories (`expiresAt`) |
| `notifications` | Activity inbox |
| `hashtags` / `postHashtags` | Explore |
| `conversations` / `messages` | DMs |

## Local note

Until `.env.local` is filled, the UI loads with a warning banner; Auth/Firestore calls will fail until a real project is configured.
