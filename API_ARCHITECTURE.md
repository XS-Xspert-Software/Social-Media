# API Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PULSE FRONTEND                           │
│                  (Vue.js Application)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ imports from
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              /frontend/src/config/api.js                    │
│                 (SINGLE SOURCE OF TRUTH)                     │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │           API_BASE_URLS                      │          │
│  │  • POSTS_API                                 │          │
│  │  • AUTH_API                                  │          │
│  │  • MESSAGES_API                              │          │
│  │  • GROUPS_API                                │          │
│  │  • FRIENDS_API                               │          │
│  │  • PROFILE_API                               │          │
│  │  • FEATURES_API                              │          │
│  │  • OPINIONS_API                              │          │
│  │  • ALERTS_API                                │          │
│  │  • VIDEOS_API                                │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │              ENDPOINTS                       │          │
│  │  • posts.*        (6 endpoints)              │          │
│  │  • users.*        (2 endpoints)              │          │
│  │  • profile.*      (1 endpoint)               │          │
│  │  • friends.*      (2 endpoints)              │          │
│  │  • messages.*     (5 endpoints)              │          │
│  │  • groups.*       (13 endpoints)             │          │
│  │  • videos.*       (1 endpoint)               │          │
│  │  • features.*     (2 endpoints)              │          │
│  │  • opinions.*     (1 endpoint)               │          │
│  │  • alerts.*       (1 endpoint)               │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │         HELPER FUNCTIONS                     │          │
│  │  • apiRequest(url, options)                  │          │
│  │  • buildUrl(baseUrl, params)                 │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ makes requests to
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL SERVERLESS APIs                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔵 sports321.vercel.app                                    │
│     ↳ Posts, Comments, Likes, Follow/Unfollow              │
│                                                              │
│  🔵 1999-theta.vercel.app                                   │
│     ↳ User Authentication, User List                        │
│                                                              │
│  🔵 recent-six.vercel.app                                   │
│     ↳ Direct Messages, Recent Conversations                 │
│                                                              │
│  🔵 yupitis.vercel.app                                      │
│     ↳ Group Chats, Members, Join Requests                   │
│                                                              │
│  🔵 burger-eta-eight.vercel.app                             │
│     ↳ Friends List                                          │
│                                                              │
│  🔵 venus-ecru.vercel.app                                   │
│     ↳ Profile Updates (Bio, Avatar, Banner)                 │
│                                                              │
│  🔵 199-ten.vercel.app                                      │
│     ↳ Features, Trending Hashtags, Post Details             │
│                                                              │
│  🔵 hamburger-henna.vercel.app                              │
│     ↳ Post Opinions                                         │
│                                                              │
│  🔵 2damnit.vercel.app                                      │
│     ↳ Alerts                                                │
│                                                              │
│  🔵 chyna.vercel.app                                        │
│     ↳ Videos Feed                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│           LEGACY BACKENDS (Commented Out)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚪ localhost:3000                                           │
│     ↳ Node.js Backend (Not actively used)                   │
│     ↳ Kept for open-source tinkerers                        │
│                                                              │
│  ⚪ localhost:8000                                           │
│     ↳ Django Backend (Not actively used)                    │
│     ↳ Kept for open-source tinkerers                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════
                        DATA FLOW
═══════════════════════════════════════════════════════════════

Component/Store
      │
      │ import { ENDPOINTS, apiRequest }
      ▼
  api.js Config
      │
      │ apiRequest(ENDPOINTS.posts.getPosts)
      ▼
 Helper Function
      │
      │ fetch(url, options)
      ▼
  Vercel API
      │
      │ JSON Response
      ▼
   Component


═══════════════════════════════════════════════════════════════
                    MODIFICATION WORKFLOW
═══════════════════════════════════════════════════════════════

1. Need to change an API URL?
   ├─→ Open: /frontend/src/config/api.js
   ├─→ Find: API_BASE_URLS or ENDPOINTS
   └─→ Edit: The relevant URL

2. Need to add a new endpoint?
   ├─→ Open: /frontend/src/config/api.js
   ├─→ Add to: ENDPOINTS object
   ├─→ Update: API_CONFIGURATION.md
   └─→ Update: endpoints.js quick reference

3. Need to use an endpoint?
   ├─→ Import: import { ENDPOINTS, apiRequest } from '@/config/api'
   ├─→ Use: await apiRequest(ENDPOINTS.category.endpointName)
   └─→ Handle: Response/errors


═══════════════════════════════════════════════════════════════
                      FILE LOCATIONS
═══════════════════════════════════════════════════════════════

📄 Main Config:       /frontend/src/config/api.js
📄 Documentation:     /frontend/src/config/API_CONFIGURATION.md
📄 Quick Reference:   /frontend/src/config/endpoints.js
📄 This Diagram:      /API_ARCHITECTURE.md
📄 Summary:           /API_CENTRALIZATION.md
