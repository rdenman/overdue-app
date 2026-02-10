# Project Charter — Chore Tracking App

## Goal
Build a mobile-only chore tracking app that helps households coordinate recurring chores.
The app should feel fast, polished, and reliable, even when offline.

Primary use case:
- Users belong to one or more households
- Households share visibility into chores
- Chores recur on flexible intervals
- Completion is simple, trackable, and attributable

## Product Principles
- Session-based offline support with in-memory caching
- Instant-feeling UI with eventual consistency
- Simple mental model for chores and intervals
- Shared responsibility without over-complex roles
- Smooth animations and high-quality UX

---

## Platform & Tech

### Client
- Expo (managed workflow)
- Mobile only (iOS + Android)
- TypeScript
- React Native
- Declarative animations (Reanimated / Layout animations)

### Backend
- Firebase Auth
- Firestore
- Firebase Cloud Functions (minimal, only when required)
- Firebase Cloud Messaging (basic reminders)

### Constraints
- No web app
- No custom native modules (maintains Expo Go compatibility)
- Memory-only cache for offline support (tradeoff for Expo Go)
- Prefer simple, readable code over abstractions
- Strong typing everywhere
- Max ~300 LOC per file
- Favor explicit data models over magic behavior

---

## Users & Households

### Users
- Authenticate via:
  - Email + password
  - Apple
  - Google
  - Facebook
- No anonymous users
- Users may belong to multiple households
- Users may delete their account

### Households
- A household may exist with zero chores
- A household has members with roles:
  - `admin`
  - `member`
- Roles are minimal and fixed

### Membership
- Users join households via email invite
- Invites must be explicitly accepted
- Only admins can invite users
- Offline users cannot invite

### Account Deletion
- If a user deletes their account:
  - If they are the owner/admin of a household, household data is cleaned up
  - Otherwise, membership is removed

---

## Chores

### Visibility & Ownership
- Chores are created by users within a household
- All household members can see all chores
- Chores may be assigned to:
  - a specific user
  - or remain unassigned
- Assignment does not affect visibility

### Completion
- A chore can be completed once per interval
- Completion records:
  - `completedAt`
  - `completedBy`
- Completion can be undone

### Missed Chores
- If not completed by the due date:
  - chore is marked as overdue
- When completed late:
  - the next interval resets based on the actual completion date

---

## Scheduling & Intervals

Supported intervals (v1):
- Daily
- Weekly
- Monthly
- Every N months
- Yearly
- Every N years
- Custom interval (explicit duration-based)

Rules:
- Interval changes apply forward (not historical)
- Overdue completion resets the interval from completion time
- Only one active interval per chore

---

## History & Tracking

- Only the latest completion is required
- No long-term completion history (v1)
- Attribution (who completed) is required
- Undoing completion restores previous due state

---

## Offline Behavior

### Session-Based Offline Support
Within an active app session, users can work offline with previously loaded data:
- View cached chores and household data
- Create chores (queued for sync)
- Edit chores and intervals (queued for sync)
- Mark chores complete or undo completion (queued for sync)

### Limitations
- **Cache is memory-only**: Data does not persist between app restarts
- **Requires initial online load**: First launch or after restart requires network connection
- **Session-scoped**: Offline capabilities only work during current app session
- Users cannot invite or accept household invites while offline

### Technical Constraint
Persistent offline cache requires native modules which conflicts with Expo Go compatibility.
To enable full offline-first persistence, app would need to migrate to @react-native-firebase
and use development builds (EAS Build).

### Sync Model
- UI updates optimistically
- Firestore is the source of truth
- Last-write-wins conflict resolution is acceptable
- Eventual consistency is expected and acceptable
- Queued writes sync when connection is restored

---

## Notifications

- Push notifications for due chores
- Global daily reminder (v1)
- Per-chore notification customization is out of scope for v1

---

## UX & Navigation

### Core Screens
- **Today’s Chores** (primary entry point)
- All Chores
- Household Dashboard
- Chore Detail / Edit
- Household Settings

### UX Goals
- UI should feel instant
- Animations should be smooth and purposeful
- Transitions should reinforce task completion and progress
- No cluttered dashboards or dense tables

---

## Explicit Non-Goals (v1)

- Gamification (points, streaks, rewards)
- Calendar integrations
- Location-based chores
- Web admin UI
- Advanced analytics

Basic stats or light visual summaries on the household dashboard are acceptable but not required.

---

## Development Approach

- Build in clearly defined phases
- One phase at a time, no future feature leakage
- Prefer evolving existing files over creating new abstractions
- If ambiguity exists, choose the simplest viable option and note it

Cursor should treat this document as a **hard constraint** for all decisions.
