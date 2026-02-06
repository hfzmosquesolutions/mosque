# Suggestion: Legacy Registration Date Implementation

## Problem
Admins need to add legacy users who registered with the mosque long ago, but we shouldn't modify `created_at` (audit trail).

## Recommended Solution

### Option 1: Add `original_registration_date` field (RECOMMENDED) ✅

**Pros:**
- Preserves audit trail (`created_at` stays immutable)
- Clear separation of concerns
- Easy to query and filter
- Maintains data integrity

**Cons:**
- Requires database migration
- One additional field

**Implementation:**
1. Add `original_registration_date DATE` field to `khairat_members` table
2. Allow admins to set this when creating/editing members
3. Display both dates in UI:
   - "Registered in system: [created_at]" (when record was created)
   - "Original registration: [original_registration_date]" (historical date)
4. Use `original_registration_date` for sorting/filtering legacy members

### Option 2: Use existing `joined_date` field

**Pros:**
- No migration needed
- Field already exists

**Cons:**
- `joined_date` might be used for when they became active (different from registration)
- Less clear intent
- Could cause confusion

### Option 3: Allow editing `created_at` (NOT RECOMMENDED) ❌

**Cons:**
- Breaks audit trail
- Can cause issues with sorting/filtering
- Bad practice for database design
- Makes it hard to track when records were actually created in system

## Recommendation

**Go with Option 1** - Add `original_registration_date` field.

This is the cleanest, most maintainable solution that follows database best practices.
