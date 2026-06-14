# CalorieLens — Features & User Flows

## User Roles

| Role | Description |
|---|---|
| `USER` | Regular user, can scan meals and track calories |
| `ADMIN` | Full access to admin portal, user management, analytics |

---

## Feature List

### Auth
- [x] Register with email + password
- [x] Login with email + password
- [x] Login with Google OAuth
- [x] Session persistence (NextAuth)
- [x] Protected routes via middleware

### Meal Scanning (Core Feature)
- [ ] Upload photo from gallery
- [ ] Take photo directly from camera (mobile browser)
- [ ] Send image to Gemini Vision API
- [ ] Receive structured response: meal name, calories, macros (protein, carbs, fat)
- [ ] Display result with confidence indicator
- [ ] Allow user to edit/correct AI estimate before saving
- [ ] Save meal entry to database

### Daily Tracking
- [ ] Dashboard showing today's total calories
- [ ] Macro breakdown (protein / carbs / fat) with progress rings
- [ ] Meal list for the day (breakfast, lunch, dinner, snack)
- [ ] Add meal manually (without photo)
- [ ] Delete a meal entry

### History
- [ ] Calendar view — navigate by day
- [ ] Daily summary cards (calories in vs goal)
- [ ] Filterable meal log

### Goals
- [ ] Set daily calorie goal
- [ ] Set macro targets (optional)
- [ ] BMI / TDEE calculator (optional helper)
- [ ] Goal progress visualization

### Profile
- [ ] Edit name, avatar
- [ ] Change password
- [ ] View account stats (total scans, days tracked)
- [ ] Delete account

### Admin Portal
- [ ] Overview dashboard (total users, total scans today, active users)
- [ ] User list with search and filter
- [ ] View individual user meal history
- [ ] Disable / enable user accounts
- [ ] Scan log (all AI requests, latency, tokens used)
- [ ] Analytics charts (daily scans, new users over time)

---

## User Flows

### Flow 1: Scan a Meal
```
User opens /scan
→ Taps "Take Photo" or "Upload"
→ Image preview shown
→ Taps "Analyze"
→ Loading state (Gemini processing)
→ Result card appears:
    - Meal name (e.g. "Grilled Chicken Salad")
    - Calories: 420 kcal
    - Protein: 38g | Carbs: 12g | Fat: 18g
    - Confidence: High / Medium / Low
→ User can edit values
→ Taps "Save to Today"
→ Redirected to Dashboard
```

### Flow 2: View Daily Dashboard
```
User opens /dashboard
→ Sees today's date
→ Calorie ring: 920 / 1800 kcal
→ Macro bars: Protein 72g, Carbs 88g, Fat 34g
→ Meal list below:
    - Breakfast: Oatmeal — 310 kcal
    - Lunch: Grilled Chicken Salad — 420 kcal
    - Snack: Greek Yogurt — 190 kcal
→ "+ Add Meal" button → /scan
```

### Flow 3: Admin User Management
```
Admin opens /admin/users
→ Sees paginated user table
→ Search by name or email
→ Clicks a user → sees their meal history
→ Can disable account (soft delete)
```

---

## AI Response Contract

The Gemini prompt will request a structured JSON response:

```json
{
  "meal_name": "Grilled Chicken Salad",
  "calories": 420,
  "protein_g": 38,
  "carbs_g": 12,
  "fat_g": 18,
  "confidence": "high",
  "notes": "Estimate based on visible ingredients. Dressing not included."
}
```

Confidence levels: `high` | `medium` | `low`
