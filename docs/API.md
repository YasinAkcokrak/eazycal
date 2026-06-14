# CalorieLens — API Endpoints

All API routes are under `/api/`. Protected routes require a valid NextAuth session.

---

## Auth

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register with email + password | Public |
| POST | `/api/auth/[...nextauth]` | NextAuth handler (login, OAuth, etc.) | Public |

---

## Meal Analysis

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/analyze` | Upload image → Gemini Vision → return nutrition estimate | User |

### POST `/api/analyze`
**Request:** `multipart/form-data`
```
image: File (jpg/png/webp, max 10MB)
```

**Response:**
```json
{
  "meal_name": "Grilled Chicken Salad",
  "calories": 420,
  "protein_g": 38,
  "carbs_g": 12,
  "fat_g": 18,
  "confidence": "high",
  "notes": "Estimate based on visible ingredients.",
  "image_url": "https://blob.vercel-storage.com/..."
}
```

---

## Meals

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/api/meals` | Get meals (filter by date) | User |
| POST | `/api/meals` | Save a meal entry | User |
| PATCH | `/api/meals/[id]` | Edit a meal entry | User |
| DELETE | `/api/meals/[id]` | Delete a meal entry | User |

### GET `/api/meals?date=2025-06-06`
**Response:**
```json
{
  "date": "2025-06-06",
  "totals": {
    "calories": 920,
    "protein_g": 72,
    "carbs_g": 88,
    "fat_g": 34
  },
  "meals": [
    {
      "id": "clx...",
      "name": "Oatmeal",
      "mealType": "BREAKFAST",
      "calories": 310,
      "protein_g": 10,
      "carbs_g": 55,
      "fat_g": 6,
      "imageUrl": null,
      "loggedAt": "2025-06-06T08:30:00Z"
    }
  ]
}
```

### POST `/api/meals`
**Request:**
```json
{
  "name": "Grilled Chicken Salad",
  "mealType": "LUNCH",
  "calories": 420,
  "protein_g": 38,
  "carbs_g": 12,
  "fat_g": 18,
  "image_url": "https://blob.vercel-storage.com/...",
  "confidence": "high",
  "ai_notes": "...",
  "logged_at": "2025-06-06T13:00:00Z"
}
```

---

## Goals

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/api/goals` | Get user's current goal | User |
| POST | `/api/goals` | Create or update goal | User |

---

## Admin

All admin routes require `role: ADMIN`.

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/api/admin/stats` | Overview stats (users, scans today, etc.) | Admin |
| GET | `/api/admin/users` | Paginated user list | Admin |
| GET | `/api/admin/users/[id]` | Single user detail + meal history | Admin |
| PATCH | `/api/admin/users/[id]` | Enable / disable user | Admin |
| GET | `/api/admin/scan-logs` | All AI scan requests with metadata | Admin |

### GET `/api/admin/stats`
**Response:**
```json
{
  "total_users": 142,
  "active_users_today": 23,
  "total_scans_today": 87,
  "total_scans_all_time": 4210
}
```
