

## Add Profile Editing with Phone Number Support

### Problem Summary

Currently there is no way for users (drivers, owners, or admins) to update their profile information such as their name. Additionally, owners/admins cannot see driver contact information (phone numbers) when they need to reach them quickly.

---

### Solution Overview

| Feature | Description |
|---------|-------------|
| Profile editing | All users can edit their name and phone number via user menu |
| Phone number field | New optional field added to profiles table |
| Driver visibility | Team Management table shows phone numbers for quick access |

---

### Database Changes

Add `phone_number` column to the `profiles` table:

```sql
ALTER TABLE public.profiles
ADD COLUMN phone_number text;
```

---

### File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx.sql` | Create | Add `phone_number` column to profiles |
| `src/components/profile/ProfileEditDialog.tsx` | Create | Dialog for editing name and phone number |
| `src/components/layout/Header.tsx` | Modify | Add "Edit Profile" menu item for all users |
| `src/contexts/BusinessContext.tsx` | Modify | Add `updateProfile` function and phone to interface |
| `src/pages/UserManagement.tsx` | Modify | Display phone number column in team table |

---

### Technical Implementation

#### 1. Migration - Add Phone Number Column

```sql
ALTER TABLE public.profiles
ADD COLUMN phone_number text;

COMMENT ON COLUMN public.profiles.phone_number IS 'Optional contact phone number';
```

#### 2. ProfileEditDialog Component

Create a new dialog component accessible from the header dropdown:

```tsx
// Key features:
- Form with full_name and phone_number fields
- Phone number validation (optional, but validate format if provided)
- Uses supabase to update own profile (allowed by existing RLS)
- Invalidates profile query on success
```

#### 3. Header.tsx - Add Edit Profile Option

Add menu item between user info and Business Settings:

```tsx
<DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
  <Pencil className="mr-2 h-4 w-4" />
  Edit Profile
</DropdownMenuItem>
```

This will be available to ALL users (drivers, admins, owners).

#### 4. BusinessContext Updates

Update the Profile interface and add updateProfile function:

```tsx
interface Profile {
  id: string;
  business_id: string | null;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;  // NEW
}

// Add updateProfile mutation
const updateProfileMutation = useMutation({
  mutationFn: async (data: Partial<Profile>) => {
    if (!profile) throw new Error('No profile found');
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', profile.id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  },
});
```

#### 5. UserManagement - Show Phone Numbers

Add phone column to team members table:

```tsx
// Update TeamMember interface
interface TeamMember {
  // ... existing fields
  phone_number: string | null;  // NEW
}

// Update query to fetch phone
.select("id, email, full_name, phone_number")

// Add column to table
<TableHead>Phone</TableHead>

// Display in row
<TableCell>
  {member.phone_number || (
    <span className="text-muted-foreground text-xs">Not set</span>
  )}
</TableCell>
```

---

### UI Flow

```text
User clicks profile icon (header)
       ↓
Dropdown shows "Edit Profile" option
       ↓
Dialog opens with current name & phone
       ↓
User edits fields → saves
       ↓
Profile updated, header reflects new name
```

For owners viewing team:

```text
Owner opens Team Management
       ↓
Table shows Name, Email, Phone, Role, Joined, Actions
       ↓
Owner can quickly see driver phone numbers
```

---

### Expected Outcomes

1. **All users** can update their name and phone number from the header menu
2. **Owners/admins** can see team member phone numbers in the Team Management table
3. **Drivers** can add their phone number so business owners can contact them
4. Profile changes reflect immediately in the header

