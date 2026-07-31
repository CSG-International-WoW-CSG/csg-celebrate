# CSG Celebrate — one-time Firebase + Pages checklist
#
# 1) Create Firebase project (Console): https://console.firebase.google.com/
#    - Name suggestion: csg-celebrate
#    - Do NOT reuse wow-csg
#    - Prefer Blaze before company traffic
#
# 2) Enable products:
#    - Authentication → Email/Password
#    - Firestore Database (production mode, then deploy rules below)
#    - Storage
#
# 3) Register a Web app; copy config into .env.local from .env.example
#
# 4) From this folder, deploy rules/indexes:
#      npx firebase-tools login
#      npx firebase-tools use csg-celebrate
#      npx firebase-tools deploy --only firestore,storage
#
# 5) GitHub repo (CSG-International-WoW-CSG/csg-celebrate):
#    - Settings → Pages → Source: GitHub Actions
#    - Settings → Secrets and variables → Actions — add:
#        VITE_FIREBASE_API_KEY
#        VITE_FIREBASE_AUTH_DOMAIN
#        VITE_FIREBASE_PROJECT_ID
#        VITE_FIREBASE_STORAGE_BUCKET
#        VITE_FIREBASE_MESSAGING_SENDER_ID
#        VITE_FIREBASE_APP_ID
#
# 6) Push main → workflow deploys to:
#      https://csg-international-wow-csg.github.io/csg-celebrate/
