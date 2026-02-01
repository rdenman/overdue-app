# Firestore Schema

This document describes the Firestore database structure for the Overdue chore tracking app.

## Collections

### `/users/{uid}`

User profile documents. One document per authenticated user.

**Fields:**
- `uid` (string) - Firebase Auth user ID, matches document ID
- `email` (string) - User's email address
- `displayName` (string) - User's display name
- `emailVerified` (boolean) - Whether the user's email has been verified
- `createdAt` (timestamp) - When the user profile was created
- `updatedAt` (timestamp) - When the user profile was last updated

**Security:**
- Users can read/write their own document only
- Document ID must match authenticated user's UID

---

### `/households/{householdId}`

Household documents. Represents shared household spaces.

**Fields:**
- `id` (string) - Household ID, matches document ID
- `name` (string) - Household name (e.g., "Personal", "Family")
- `ownerId` (string) - User ID of the household owner/admin
- `createdAt` (timestamp) - When the household was created
- `updatedAt` (timestamp) - When the household was last updated

**Security:**
- Users can read households they are members of (via householdMembers lookup)
- Users can create households (become owner automatically)
- Only owners can update/delete households

---

### `/householdMembers/{memberId}`

Membership relationships between users and households.

**Document ID format:** `{householdId}_{userId}` (composite key)

**Fields:**
- `id` (string) - Composite member ID, matches document ID
- `householdId` (string) - Reference to household
- `userId` (string) - Reference to user
- `role` (string) - Either "admin" or "member"
- `joinedAt` (timestamp) - When the user joined the household

**Security:**
- Users can read memberships where userId matches their UID
- Household owners can create/update/delete memberships for their household
- Users can delete their own membership (leave household)

---

### `/chores/{choreId}`

Chore documents within households.

**Fields:**
- `id` (string) - Chore ID, matches document ID
- `householdId` (string) - Reference to parent household
- `name` (string) - Chore name/title
- `description` (string, optional) - Detailed description
- `assignedTo` (string, optional) - User ID of assigned user, or undefined for unassigned
- `createdBy` (string) - User ID of creator
- `createdAt` (timestamp) - When the chore was created
- `updatedAt` (timestamp) - When the chore was last updated
- `interval` (object) - Recurrence interval
  - `type` (string) - "daily", "weekly", "monthly", "yearly", or "custom"
  - `value` (number) - For "every N months/years" or custom duration in days
- `dueAt` (timestamp) - When the chore is next due
- `isOverdue` (boolean) - Whether the chore is overdue
- `lastCompletion` (object, optional) - Most recent completion record
  - `completedAt` (timestamp) - When completed
  - `completedBy` (string) - User ID of who completed it

**Security:**
- Users can read chores in households they belong to
- Household members can create/update/delete chores in their household
- All household members have equal chore permissions (no special admin rights for chores)

---

### `/invites/{inviteId}`

Household invitation documents. (Phase 2+)

**Fields:**
- `id` (string) - Invite ID, matches document ID
- `householdId` (string) - Reference to household
- `invitedBy` (string) - User ID of inviter
- `invitedEmail` (string) - Email address of invitee
- `role` (string) - Role to grant ("admin" or "member")
- `status` (string) - "pending", "accepted", "declined", or "expired"
- `createdAt` (timestamp) - When the invite was created
- `expiresAt` (timestamp) - When the invite expires

**Security:**
- Household admins can create invites
- Invited users (matched by email) can read/update their invites
- System can update invite status (via Cloud Function or client-side)

---

## Indexes

### Composite Indexes

1. **householdMembers by userId**
   - Collection: `householdMembers`
   - Fields: `userId` (Ascending)
   - Used for: Finding all households a user belongs to

2. **chores by householdId and dueAt**
   - Collection: `chores`
   - Fields: `householdId` (Ascending), `dueAt` (Ascending)
   - Used for: Listing chores for a household, sorted by due date

3. **chores by householdId and isOverdue**
   - Collection: `chores`
   - Fields: `householdId` (Ascending), `isOverdue` (Descending), `dueAt` (Ascending)
   - Used for: Finding overdue chores first

---

## Data Relationships

```
User (1) ─────< HouseholdMember (N) >───── (1) Household
                                                   |
                                                   |
                                                   └───< Chore (N)
                                                          |
                                                          └─ lastCompletion
```

## Offline Behavior

- All collections support offline persistence via Firestore SDK
- Writes are queued when offline and synced when connection returns
- Last-write-wins conflict resolution (Firestore default)
- No custom conflict resolution logic in v1
