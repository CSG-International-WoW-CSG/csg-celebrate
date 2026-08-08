# WoW-CSG Celebrate — setup status

**Repo:** https://github.com/CSG-International-WoW-CSG/csg-celebrate  
**Live URL:** https://csg-international-wow-csg.github.io/csg-celebrate/  
**Firebase:** https://console.firebase.google.com/project/csg-celebrate/overview

## Done
- Firebase project `csg-celebrate` created (separate from `wow-csg`)
- Web app registered; `.env.local` written locally (gitignored)
- Firestore database created (`asia-south1`)
- Firestore rules + indexes deployed
- GitHub repo + Pages workflow + Action secrets configured

## You must click once in Console (Auth + Storage)

Firebase Auth and Storage need a first-time enable in the browser:

1. **Auth — Email/Password**  
   https://console.firebase.google.com/project/csg-celebrate/authentication/providers  
   → Get started → enable **Email/Password** → Save

2. **Storage**  
   https://console.firebase.google.com/project/csg-celebrate/storage  
   → Get started → use default bucket → Done  
   Then from `csg-celebrate/`:

```bash
npm run deploy:rules
```

(That deploys Storage rules after the bucket exists.)

3. Optional but recommended: upgrade project to **Blaze** before company-wide use.

## Local run

```bash
cd csg-celebrate
npm install
npm run dev
```

`.env.local` is already filled if you used this machine’s setup.
