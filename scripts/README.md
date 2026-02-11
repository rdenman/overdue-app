# Development Scripts

This directory contains scripts for seeding and managing test data in your local development environment.

## Prerequisites

- Make sure your `.env.local` file is configured with valid Firebase credentials
- The Firebase project should be accessible

## Available Scripts

### Seed Script

Creates test data for local development including:
- **3 test users** with emails `test1@test.com`, `test2@test.com`, `test3@test.com`
  - All users have the same password: `Password1!`
  - Display names: "Test User 1", "Test User 2", "Test User 3"

- **5 households**:
  - Personal household for User 1 (only User 1)
  - Personal household for User 2 (only User 2)
  - Personal household for User 3 (only User 3)
  - Family household (all 3 users)
  - Parents household (only Users 1 and 2)

- **20-30 chores per household** with:
  - Mixed intervals (daily, weekly, monthly, custom)
  - Some with descriptions, some without
  - Some assigned to users, some unassigned
  - Variety of due dates:
    - ~30% overdue (past due date)
    - ~20% due today
    - ~50% due in the future

**Usage:**
```bash
pnpm seed
```

The script will:
- Create users if they don't exist, or sign in if they already exist
- Create households and memberships
- Generate realistic chore data for testing

### Cleanup Script

Removes all test data created by the seed script, including:
- All households associated with test users
- All chores in those households
- All invites for those households
- All household memberships
- User profiles from Firestore
- User accounts from Firebase Auth

**Usage:**
```bash
pnpm cleanup
```

The script will:
- Find all test users by their email addresses
- Delete all their associated data (households, chores, memberships)
- Remove user profiles and auth accounts

**Note:** The cleanup script automatically finds all data associated with the test users, so you don't need to pass any IDs.

## Test Credentials

After running the seed script, you can sign in with any of these accounts:

```
Email: test1@test.com
Password: Password1!

Email: test2@test.com
Password: Password1!

Email: test3@test.com
Password: Password1!
```

## Troubleshooting

### Authentication Errors

If you get authentication errors:
1. Check that your `.env.local` file has the correct Firebase credentials
2. Verify that the Firebase project is accessible
3. Make sure Email/Password authentication is enabled in Firebase Console

### Permission Errors

If you get Firestore permission errors:
1. Make sure your Firestore security rules allow the operations
2. For local development, consider using Firestore Emulator or relaxed rules

### Already Exists Errors

If users already exist:
- The seed script will sign in with existing users instead of creating new ones
- Run `pnpm cleanup` first if you want to start completely fresh

## Development Workflow

Typical workflow:

```bash
# Seed test data
pnpm seed

# Do your development and testing
# ...

# Clean up when done
pnpm cleanup
```

You can run the seed script multiple times safely - it will reuse existing users and create additional households and chores.
