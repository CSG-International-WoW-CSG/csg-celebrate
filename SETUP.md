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

2. **Storage** (required for Share + Stories — without this, UI sticks on “Sharing…”)  
   https://console.firebase.google.com/project/csg-celebrate/storage  
   → Get started → use default bucket (`csg-celebrate.firebasestorage.app`) → Done  
   Then from `csg-celebrate/`:

```bash
npm run deploy:rules
```

(That deploys Storage rules after the bucket exists.)

3. **Blaze plan** is often required for Storage uploads from the web app.  
   https://console.firebase.google.com/project/csg-celebrate/usage/details  
   → Modify plan → Blaze (pay-as-you-go; free Spark quotas still apply until exceeded).

## Local run

```bash
cd csg-celebrate
npm install
npm run dev
```

`.env.local` is already filled if you used this machine’s setup.
