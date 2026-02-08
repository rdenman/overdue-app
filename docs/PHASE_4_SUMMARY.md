# Phase 4 Implementation Summary

## Overview

This document summarizes the implementation of Phase 4 (Dashboard Stats, Schedule Visualization, Calendar View, Notifications) for the Overdue chore tracking app.

**Implementation Date:** February 8, 2026
**Status:** ✅ Complete - All todos finished, TypeScript compiles cleanly, no linting errors

---

## Scope Decisions (per PROJECT_CHARTER)

- **Stats**: Basic stats on the household dashboard computed from current chore state only (no long-term history).
- **Calendar**: Internal calendar view for browsing upcoming chores — NOT external calendar integration (non-goal).
- **Notifications**: Local notifications via `expo-notifications`. Daily reminder + per-chore due date alerts. FCM/Cloud Functions deferred to a future phase.
- **No new Firestore collections or schema changes** — all features derive from existing chore data.

---

## Dependencies Installed

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-calendars` | ^1.1314.0 | Monthly calendar UI with marked dates |
| `expo-notifications` | ^0.32.16 | Local notification scheduling and permissions |

Both are well-maintained, widely-used community packages compatible with Expo managed workflow.

---

## Phase 4: Completed Features

### ✅ 1. Household Dashboard Stats

**Modified Files:**
- `lib/hooks/use-chores.ts` — Added `useAllHouseholdChoreStats(userId, householdIds)` hook
- `lib/hooks/query-keys.ts` — Added `chores.allHouseholds(userId)` query key
- `app/(tabs)/explore.tsx` — Household cards now display stat chips

**How it works:**
- Single batch query via existing `getChoresForHouseholds()` — avoids N+1 per-household queries
- Client-side grouping computes per-household stats: `{ total, overdue, dueToday }`
- Stat chips rendered on each household card using existing `Chip` component:
  - Red `danger` chip for overdue count (e.g. "2 overdue")
  - Blue `primary` chip for due today count (e.g. "1 due today")
  - Falls back to plain text total count when no urgent items

---

### ✅ 2. Upcoming Schedule Preview

**Modified Files:**
- `lib/services/chore-service.ts` — Added `getUpcomingDueDates(fromDate, interval, count)` pure utility
- `app/households/[id]/chore/[choreId].tsx` — Added "Upcoming Schedule" section in view mode

**How it works:**
- `getUpcomingDueDates()` iterates `calculateNextDueDate()` N times from the current due date
- Chore detail screen shows next 5 upcoming due dates in a numbered list with formatted dates
- Pure client-side computation — no data storage or network calls

**Refactoring:**
- Extracted `ChoreEditForm` into `components/chore-edit-form.tsx` to keep the chore detail screen under the ~300 LOC limit

---

### ✅ 3. Calendar View

**New File:**
- `app/calendar.tsx` (200 LOC) — Full-screen monthly calendar

**Modified Files:**
- `app/(tabs)/index.tsx` — Added calendar icon button in header
- `app/_layout.tsx` — Registered `calendar` route in root Stack

**How it works:**
- Uses `react-native-calendars` `Calendar` component with `multi-dot` marking type
- Fetches all chores across all households via existing `useTodayChores` hook
- Builds `markedDates` object with color-coded dots:
  - Red dots for dates with overdue chores
  - Primary color dots for dates with normal due chores
- Day selection shows filtered chore list below the calendar
- Tapping a chore navigates to its detail screen
- Supports swipe navigation between months
- Theme-aware: adapts to light/dark mode

**Navigation:**
```
Today's Chores → [calendar icon] → Calendar Screen
Calendar Screen → [tap chore] → Chore Detail
```

---

### ✅ 4. Notification System

**New Files:**
- `lib/services/notification-service.ts` (169 LOC) — Core notification logic
- `lib/hooks/use-notification-settings.ts` (57 LOC) — AsyncStorage-backed preferences
- `app/settings.tsx` (279 LOC) — Notification settings screen

**Modified Files:**
- `app.config.js` — Added `expo-notifications` to plugins array
- `app/_layout.tsx` — Configured notification handler, request permissions on first auth
- `app/(tabs)/index.tsx` — Added settings icon in header, notification sync on mount
- `lib/hooks/use-chores.ts` — Mutation `onSuccess` callbacks trigger notification re-sync

#### Notification Service (`notification-service.ts`)

| Function | Description |
|----------|-------------|
| `requestPermissions()` | Request notification permission from OS; sets up Android notification channel |
| `configureNotificationHandler()` | Configure foreground notification display (called once at module level) |
| `scheduleAllNotifications(chores, settings)` | Master re-sync: cancel all pending, then re-schedule daily reminder + per-chore alerts |
| `scheduleDailyReminder(time)` | Repeating daily local notification at chosen time (default 9:00 AM) |
| `scheduleChoreNotification(chore)` | One-time notification at 8:00 AM on chore's due date |
| `cancelAllNotifications()` | Clear all scheduled notifications |

#### Notification Settings

Settings shape (persisted to AsyncStorage):
```typescript
interface NotificationSettings {
  enabled: boolean;             // Master switch (default: true)
  dailyReminderEnabled: boolean; // Daily reminder toggle (default: true)
  dailyReminderTime: string;     // "HH:MM" format (default: "09:00")
  choreAlertsEnabled: boolean;   // Per-chore alerts toggle (default: true)
}
```

#### Settings Screen (`settings.tsx`)

- Master toggle: Enable/disable all notifications
- Daily reminder section: Toggle on/off, time picker (15 preset times from 6 AM to 8 PM)
- Chore alerts section: Toggle due date alerts on/off
- Changes immediately re-sync all scheduled notifications

#### Notification Behavior

| Trigger | Action |
|---------|--------|
| App opens (authenticated) | Request permissions on first launch |
| Today screen mounts / chore data changes | Re-schedule all notifications |
| Chore created/updated/deleted | Re-schedule via mutation `onSuccess` |
| Chore completed/undone | Re-schedule via mutation `onSuccess` |
| Settings changed | Re-schedule with new preferences |
| Notifications disabled | Cancel all scheduled notifications |

**Scheduling constraints:**
- Daily reminder uses `SchedulableTriggerInputTypes.DAILY` (repeating trigger)
- Chore alerts use `SchedulableTriggerInputTypes.DATE` (one-time trigger)
- Only chores due within the next 14 days are scheduled (avoids OS notification limits)
- Completed chores are excluded from scheduling

---

## Navigation Changes

```
Tab Bar
  ├── Today's Chores
  │     ├── [calendar icon] → Calendar Screen (root stack)
  │     └── [gear icon] → Settings Screen (root stack)
  ├── Households
  │     └── Household card shows: "2 overdue · 1 due today"
  └── Invitations

Chore Detail Screen
  └── "Upcoming Schedule" section (next 5 dates)
```

---

## File Summary

| Action | File | LOC |
|--------|------|-----|
| New | `lib/services/notification-service.ts` | 169 |
| New | `lib/hooks/use-notification-settings.ts` | 57 |
| New | `app/calendar.tsx` | 200 |
| New | `app/settings.tsx` | 279 |
| New | `components/chore-edit-form.tsx` | 120 |
| Modify | `app.config.js` | 60 |
| Modify | `app/_layout.tsx` | 76 |
| Modify | `app/(tabs)/index.tsx` | 222 |
| Modify | `app/(tabs)/explore.tsx` | 200 |
| Modify | `lib/services/chore-service.ts` | 269 |
| Modify | `lib/hooks/use-chores.ts` | 223 |
| Modify | `lib/hooks/query-keys.ts` | 30 |
| Modify | `app/households/[id]/chore/[choreId].tsx` | 308 |

**5 new files, 8 modified files. All files stay under ~300 LOC.**

---

## Architecture Decisions

### Local Notifications over FCM
The charter mentions FCM for push notifications, but also says Cloud Functions should only be used "when required." For v1, local notifications via `expo-notifications` cover both use cases (daily reminders and chore due alerts) without requiring server infrastructure. FCM can be added in a future phase for cross-device sync.

### Centralized Notification Sync
Rather than per-mutation notification updates, we use a "cancel all + re-schedule" pattern. This is simple, correct, and avoids notification drift. The sync triggers from:
1. Today screen mount (via `useEffect` on chore data changes)
2. Mutation `onSuccess` callbacks (via `syncNotificationsFromCache` helper)

### ChoreEditForm Extraction
The chore detail screen was refactored to extract the edit form into `components/chore-edit-form.tsx`, keeping both files under the ~300 LOC charter constraint.

### Shared Query Key Strategy
Added `chores.allHouseholds(userId)` to the centralized query key factory. This enables both the dashboard stats and calendar view to share cached data via the same query key.

---

## Phase 5 Preview

Potential next features based on the project charter:
- Chore assignment rotation / fair distribution
- Household activity feed
- Cloud Functions for server-side push notifications (FCM)
- Advanced recurrence patterns (e.g. "every 2nd Tuesday")
- Chore templates / presets
