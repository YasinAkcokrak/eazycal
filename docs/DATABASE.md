# CalorieLens — Database Schema

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────

enum Role {
  USER
  ADMIN
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

enum Confidence {
  HIGH
  MEDIUM
  LOW
}

// ─── User ────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // null for OAuth users
  role          Role      @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts  Account[]
  sessions  Session[]
  meals     Meal[]
  goal      Goal?
}

// ─── NextAuth ────────────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Meal ────────────────────────────────────────────

model Meal {
  id          String     @id @default(cuid())
  userId      String
  mealType    MealType   @default(SNACK)
  name        String
  calories    Int
  proteinG    Float      @default(0)
  carbsG      Float      @default(0)
  fatG        Float      @default(0)
  imageUrl    String?    // Vercel Blob URL
  confidence  Confidence?
  aiNotes     String?
  loggedAt    DateTime   @default(now()) // the date this meal belongs to
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─── Goal ────────────────────────────────────────────

model Goal {
  id             String   @id @default(cuid())
  userId         String   @unique
  dailyCalories  Int      @default(2000)
  proteinG       Float?
  carbsG         Float?
  fatG           Float?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Table Relationships

```
User
 ├── Account[]       (OAuth providers — NextAuth)
 ├── Session[]       (active sessions — NextAuth)
 ├── Meal[]          (all meal entries)
 └── Goal            (one goal per user)
```

---

## Key Notes

- `Meal.loggedAt` — stores the actual date the user logged the meal (used for daily grouping), not `createdAt`
- `User.password` — null for Google OAuth users, bcrypt hashed for email users
- `User.isActive` — admin can soft-disable accounts without deleting data
- `Goal` is optional — users can track without setting a goal
- Images are stored in Vercel Blob, only the URL is saved in the DB
