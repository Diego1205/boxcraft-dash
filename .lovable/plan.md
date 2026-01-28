
## Fix Plan: Team Management and Invitation Flow Issues

### Problem Summary

Two related issues stem from the invitation flow and profile/role synchronization:

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| #1 | User "already a team member" but table is empty | Team members query likely failing silently OR the owner can't see all team members |
| #2 | Invited user sent to onboarding | `profiles.business_id` is NULL because RLS prevents owner from updating another user's profile |

---

### Database Evidence

```
diego1205@gmail.com:    business_id = 293bfb7d...  role = driver ✅ (should show)
diego@craftedxi.com:    business_id = NULL         role = admin  ❌ (needs fix)
diego@dervlabs.com:     business_id = 293bfb7d...  role = owner  ✅
```

---

### Root Cause Analysis

**Issue #1: Empty Team Table**
The query uses `profiles!inner` join which requires the `profiles` table to be readable. The RLS policy on `profiles` is:
```sql
USING ((id = auth.uid()) OR (business_id = get_user_business_id(auth.uid())))
```
This should work, but if `business_id` is NULL for an invited user, the join fails silently.

**Issue #2: NULL business_id**
In `InviteUserDialog.tsx`, after creating a new user or assigning a role to an existing one, the code attempts:
```typescript
await supabase.from("profiles").update({ business_id: business.id }).eq("id", authData.user.id);
```

This fails because the RLS policy only allows:
```sql
USING (id = auth.uid())  -- Users can only update their OWN profile
```

The **owner cannot update another user's profile** - RLS blocks it silently.

---

### Solution: Two-Part Fix

#### Part 1: Database - Create RPC Function for Safe Profile Updates

Create a `SECURITY DEFINER` function that the owner can call to set a user's `business_id` when inviting them:

```sql
CREATE OR REPLACE FUNCTION public.assign_user_to_business(
  _user_id uuid,
  _business_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the caller is the owner of the target business
  IF NOT has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Only business owners can assign users';
  END IF;

  -- Verify caller's business matches target business
  IF get_user_business_id(auth.uid()) != _business_id THEN
    RAISE EXCEPTION 'Cannot assign users to a different business';
  END IF;

  -- Update the user's profile
  UPDATE public.profiles
  SET business_id = _business_id
  WHERE id = _user_id;
END;
$$;
```

#### Part 2: Frontend - Update InviteUserDialog to Use RPC

Replace the direct profile update with an RPC call:

```typescript
// Instead of:
await supabase.from("profiles").update({ business_id: business.id }).eq("id", userId);

// Use:
await supabase.rpc('assign_user_to_business', {
  _user_id: userId,
  _business_id: business.id
});
```

---

### Immediate Data Fix

Run a one-time SQL to fix existing users with NULL business_id but valid roles:

```sql
UPDATE profiles p
SET business_id = ur.business_id
FROM user_roles ur
WHERE p.id = ur.user_id
  AND p.business_id IS NULL
  AND ur.business_id IS NOT NULL;
```

This will fix `diego@craftedxi.com` immediately.

---

### File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx.sql` | Create | Add `assign_user_to_business` RPC function |
| `src/components/users/InviteUserDialog.tsx` | Modify | Use RPC instead of direct profile update |

---

### Implementation Details

#### Migration SQL

```sql
-- Function to safely assign a user to a business (called by owner during invite)
CREATE OR REPLACE FUNCTION public.assign_user_to_business(
  _user_id uuid,
  _business_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the caller is an owner
  IF NOT has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Only business owners can assign users to businesses';
  END IF;

  -- Verify caller belongs to the target business
  IF get_user_business_id(auth.uid()) != _business_id THEN
    RAISE EXCEPTION 'Cannot assign users to a different business';
  END IF;

  -- Update the user's profile with the business_id
  UPDATE public.profiles
  SET business_id = _business_id
  WHERE id = _user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END;
$$;

-- Fix existing orphaned profiles (users with roles but NULL business_id)
UPDATE profiles p
SET business_id = ur.business_id
FROM user_roles ur
WHERE p.id = ur.user_id
  AND p.business_id IS NULL
  AND ur.business_id IS NOT NULL;
```

#### InviteUserDialog Changes

Replace both instances of profile update with:
```typescript
// For existing user (line 86-91)
const { error: profileError } = await supabase.rpc('assign_user_to_business', {
  _user_id: existingUser.id,
  _business_id: business.id,
});

// For new user (line 119-122)
const { error: profileError } = await supabase.rpc('assign_user_to_business', {
  _user_id: authData.user.id,
  _business_id: business.id,
});
```

---

### Expected Outcome After Fix

1. **diego@craftedxi.com** will have `business_id` set correctly and can log in to the team
2. **diego1205@gmail.com** will appear in the Team Management table (already has correct business_id)
3. Future invitations will correctly set `business_id` via the secure RPC function
4. Invited users will be routed directly to the app, not onboarding

---

### Architecture Note

Yes, businesses are fully separated with their own IDs. This is the multi-tenant SaaS model where:
- Each business has a unique `id` in the `businesses` table
- Users are linked to businesses via `profiles.business_id`
- Roles are scoped to businesses via `user_roles.business_id`
- RLS policies ensure complete data isolation between businesses
