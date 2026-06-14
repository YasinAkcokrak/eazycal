# CalorieLens — Project Overview

## Description
A web application that allows users to estimate the calorie content of meals by uploading or taking a photo. Users can track their daily calorie intake, set goals, and view progress over time. An admin portal provides user management and analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Auth | NextAuth v5 (Google + Email/Password) |
| AI / Vision | Google Gemini 2.0 Flash |
| ORM | Prisma |
| Database | PostgreSQL |
| Storage | Vercel Blob (meal photos) |
| Deploy | Vercel |

---

## Folder Structure

```
calorielens/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── scan/
│   │   ├── history/
│   │   ├── goals/
│   │   └── profile/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   ├── logs/
│   │   │   └── analytics/
│   └── api/
│       ├── auth/
│       ├── analyze/
│       ├── meals/
│       ├── goals/
│       └── admin/
├── components/
│   ├── ui/              # shadcn components
│   ├── meals/
│   ├── dashboard/
│   └── admin/
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client
│   ├── gemini.ts        # Gemini Vision client
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── middleware.ts        # Auth route protection
```

---

## Environment Variables

```env
# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Gemini AI
GEMINI_API_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=
```

---

## Key Design Decisions

- **App Router** — All routes use Next.js 15 App Router with server components where possible
- **AI Abstraction** — Gemini client is wrapped in `lib/gemini.ts` so swapping to GPT-4o later requires minimal changes
- **Route Groups** — `(auth)`, `(app)`, `(admin)` are separated with different layouts and middleware guards
- **Admin Access** — Admin routes are protected by `role: ADMIN` check in middleware
- **Image Handling** — Photos are uploaded to Vercel Blob, URL stored in DB (not base64)
