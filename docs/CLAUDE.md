# CalorieLens — Claude Code Prompt

Use this prompt to initialize the project with Claude Code.

---

## Initial Prompt

```
You are helping me build "CalorieLens" — a full-stack web app where users can photograph meals and get AI-powered calorie estimates, then track their daily intake.

## Stack
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- NextAuth v5 (Google OAuth + Email/Password)
- Prisma + PostgreSQL
- Google Gemini 2.0 Flash (Vision API)
- Vercel Blob (image storage)

## Project Structure
Use route groups:
- (auth) → /login, /register — public, no sidebar
- (app) → /dashboard, /scan, /history, /goals, /profile — authenticated users
- (admin) → /admin/... — ADMIN role only

## What to build first

### Step 1 — Project Setup
1. Initialize Next.js 15 with TypeScript and Tailwind
2. Install and configure shadcn/ui
3. Install Prisma, initialize with PostgreSQL
4. Copy this schema into prisma/schema.prisma:

[paste contents of DATABASE.md schema here]

5. Run `npx prisma migrate dev --name init`
6. Set up NextAuth v5 with:
   - Google provider
   - Credentials provider (email + bcrypt password)
   - Prisma adapter
   - Custom session to include user.role and user.id
7. Create middleware.ts to protect:
   - /dashboard, /scan, /history, /goals, /profile → require session
   - /admin/* → require session + role === ADMIN
   - /login, /register → redirect to /dashboard if already logged in

### Step 2 — Auth Pages
Build /login and /register pages using shadcn Card, Input, Button components.
- Login: email + password form + "Continue with Google" button
- Register: name + email + password form
- Both pages: clean centered layout, CalorieLens logo/wordmark at top

### Step 3 — Gemini Integration
Create lib/gemini.ts:
- Function: analyzeImage(imageBase64: string, mimeType: string): Promise<NutritionResult>
- Use @google/generative-ai SDK
- Model: gemini-2.0-flash
- Send image as inline data
- Prompt the model to return ONLY a JSON object in this format:
{
  "meal_name": string,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "confidence": "high" | "medium" | "low",
  "notes": string
}
- Parse the response, strip any markdown fences before JSON.parse()
- Return typed NutritionResult object

### Step 4 — Analyze API Route
Create app/api/analyze/route.ts:
- Accept multipart/form-data with image file
- Validate: file exists, type is image/*, size < 10MB
- Upload image to Vercel Blob → get URL
- Convert image to base64 for Gemini
- Call analyzeImage() from lib/gemini.ts
- Return JSON with nutrition data + image_url

### Step 5 — Scan Page (/scan)
Build the meal scanning UI:
- Two options: "Take Photo" (camera, mobile) and "Upload Photo"
- Image preview after selection
- "Analyze" button → POST to /api/analyze → loading spinner
- Result card showing: meal name, calories, macros, confidence badge, AI notes
- Editable fields (user can correct AI values before saving)
- Meal type selector (Breakfast / Lunch / Dinner / Snack)
- "Save to Today" button → POST to /api/meals → redirect to /dashboard

### Step 6 — Dashboard (/dashboard)
- Fetch today's meals from /api/meals?date=today
- Calorie ring (shadcn progress or recharts) showing consumed vs goal
- Macro progress bars (protein, carbs, fat)
- Scrollable meal list grouped by meal type
- Each meal card: name, calories, image thumbnail (if exists), delete button
- Floating "+ Scan Meal" button → /scan

### Step 7 — Goals Page (/goals)
- Form to set daily calorie goal and optional macro targets
- POST to /api/goals to save
- Show current goal summary

### Step 8 — History Page (/history)
- Date picker (default: today)
- Daily summary for selected date (same as dashboard but read-only)

### Step 9 — Admin Portal (/admin)
- /admin → overview stats cards (total users, scans today, active users)
- /admin/users → paginated table with search (name/email), status badge, "View" and "Disable" actions
- /admin/users/[id] → user profile + meal history table

## General Guidelines
- Use server components for data fetching where possible
- Use "use client" only where interactivity is needed
- All forms use react-hook-form + zod validation
- Loading states on all async actions
- Toast notifications (shadcn Sonner) for success/error feedback
- Mobile-first responsive design
- Dark mode support via shadcn theme
- Never hardcode API keys — always use process.env
```
