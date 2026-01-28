

## Password Reset and User Removal Improvements

### Problem Summary

Invited users (like `diego@craftedxi.com` and `diego1205@gmail.com`) confirmed their email but were assigned a random UUID password during invitation. They cannot log in because:
1. They don't know their password (it was randomly generated)
2. There's no "Forgot Password" option on the login page

Additionally, removing a user only removes their role - they remain as authenticated users in Supabase.

---

### Solution: Two Features

#### Feature 1: Add Forgot Password Flow

Add a password reset option to the Auth page so invited users can set their real password.

**File Changes:**

1. **Modify** `src/pages/Auth.tsx`
   - Add "Forgot Password?" link below sign-in form
   - Add new tab/section for password reset
   - Use `supabase.auth.resetPasswordForEmail()` to send reset link
   - Add a route handler for the password reset callback

2. **Create** `src/pages/ResetPassword.tsx`
   - Page that handles the password reset token from email
   - Allows user to set their new password
   - Uses `supabase.auth.updateUser({ password })`

3. **Modify** `src/App.tsx`
   - Add route for `/reset-password`

**Password Reset Flow:**
```text
User clicks "Forgot Password?"
       ↓
Enters email → supabase.auth.resetPasswordForEmail()
       ↓
Email sent with reset link
       ↓
User clicks link → /reset-password?token=...
       ↓
User sets new password → supabase.auth.updateUser()
       ↓
Redirected to login
```

---

#### Feature 2: Improve User Removal

Currently removing a user only deletes their role. The user remains in `auth.users` and `profiles`.

**Options for removal behavior:**

| Action | Effect | Re-invite Possible? |
|--------|--------|---------------------|
| Remove from team (current) | Deletes role, keeps auth user | Yes, but confusing |
| Full removal | Deletes role + profile + clears business_id | Yes, cleaner |

**Recommended Approach:**
When removing a user, also clear their `business_id` from `profiles`. This way:
- They're no longer associated with any business
- If they try to log in, they'll be sent to onboarding (which shows an error since they don't own a business)
- They can be re-invited to the same or different business

**File Changes:**

1. **Modify** `src/pages/UserManagement.tsx`
   - After deleting role, also update profile to clear `business_id`
   - Add confirmation dialog explaining what removal does

2. **Create database function** (optional, for atomicity)
   - `remove_user_from_business(user_id, business_id)` that handles both operations

---

### Implementation Details

#### Auth.tsx - Add Forgot Password

Add below the Sign In form button:
```tsx
<div className="text-center mt-4">
  <button
    type="button"
    onClick={() => setShowForgotPassword(true)}
    className="text-sm text-muted-foreground hover:text-primary underline"
  >
    Forgot your password?
  </button>
</div>
```

Add forgot password dialog/form:
```tsx
const handleForgotPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) {
    toast.error(error.message);
  } else {
    toast.success('Password reset email sent! Check your inbox.');
  }
};
```

#### ResetPassword.tsx - New Page

```tsx
const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      navigate('/auth');
    }
    setLoading(false);
  };

  return (
    // Form with password + confirm password inputs
  );
};
```

#### UserManagement.tsx - Enhanced Removal

```tsx
const removeUserMutation = useMutation({
  mutationFn: async (userId: string) => {
    // Get the user_id from the role record
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("id", userId)
      .single();
    
    if (!roleData) throw new Error("Role not found");
    
    // Delete the role
    const { error: roleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", userId)
      .eq("business_id", business?.id);
    
    if (roleError) throw roleError;
    
    // Clear business_id from profile (user can be re-invited later)
    // Note: This requires RPC function since owner can't update others' profiles
    await supabase.rpc('clear_user_business', { _user_id: roleData.user_id });
  },
  // ...
});
```

---

### Database Migration

```sql
-- Function to clear a user's business_id when removing from team
CREATE OR REPLACE FUNCTION public.clear_user_business(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is an owner
  IF NOT has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Only business owners can remove users';
  END IF;

  -- Verify the target user was in caller's business
  IF get_user_business_id(_user_id) != get_user_business_id(auth.uid()) THEN
    RAISE EXCEPTION 'Cannot modify users from other businesses';
  END IF;

  -- Clear the business_id
  UPDATE public.profiles
  SET business_id = NULL
  WHERE id = _user_id;
END;
$$;
```

---

### File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx.sql` | Create | Add `clear_user_business` function |
| `src/pages/Auth.tsx` | Modify | Add forgot password link and handler |
| `src/pages/ResetPassword.tsx` | Create | Password reset form page |
| `src/App.tsx` | Modify | Add `/reset-password` route |
| `src/pages/UserManagement.tsx` | Modify | Clear business_id on user removal |

---

### Expected Outcomes

1. **diego@craftedxi.com** and **diego1205@gmail.com** can:
   - Go to login page
   - Click "Forgot Password?"
   - Receive reset email
   - Set their real password
   - Log in successfully

2. **When removing a user:**
   - Their role is deleted
   - Their `business_id` is cleared
   - They can be cleanly re-invited to the same or different business
   - If they try to log in, they see an appropriate message (no business association)

3. **For complete re-addition:**
   - Removing and re-inviting works seamlessly
   - No "already a team member" errors for removed users

---

### Supabase Auth Configuration Note

For password reset emails to work, ensure the Site URL and Redirect URLs are configured in Supabase:
- **Authentication > URL Configuration**
- Site URL: `https://boxcraft-dash.lovable.app`
- Redirect URLs: Include both preview and production URLs

