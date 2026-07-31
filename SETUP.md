# CSG Celebrate — one-time Firebase + Pages checklist

**Repo:** https://github.com/CSG-International-WoW-CSG/csg-celebrate  
**Expected live URL:** https://csg-international-wow-csg.github.io/csg-celebrate/

## Done already
- App code pushed to `main`
- `firebase.json` / rules / indexes in repo
- Pages workflow file ready locally at `.github/workflows/deploy-pages.yml` (needs one more push after `workflow` scope)

## Your steps

### A) Firebase (required before login/posts work)

1. Open https://console.firebase.google.com/ → **Add project** → `csg-celebrate`  
   - Do **not** reuse `wow-csg`
2. Enable **Authentication → Email/Password**
3. Create **Firestore** (start in production mode)
4. Enable **Storage**
5. Project settings → Your apps → **Web** → copy config into `.env.local` (from `.env.example`)
6. Prefer upgrade to **Blaze** before company traffic
7. From `csg-celebrate/`:

```bash
npx firebase-tools login
npx firebase-tools use csg-celebrate
npx firebase-tools deploy --only firestore,storage
```

### B) GitHub Pages + secrets

1. Grant workflow scope (one-time):

```bash
gh auth refresh -h github.com -s workflow,repo,read:org
```

2. Commit and push the workflow:

```bash
cd csg-celebrate
git add .github/workflows/deploy-pages.yml
git commit -m "Add GitHub Pages deploy workflow"
git push
```

3. Repo **Settings → Pages → Source: GitHub Actions**

4. **Settings → Secrets and variables → Actions** — add:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

5. Re-run the **Deploy CSG Celebrate to GitHub Pages** workflow (or push again)
