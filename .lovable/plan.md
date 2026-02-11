

## KhipuFlow Superadmin Dashboard

### Overview

A separate, restricted dashboard accessible only to KhipuFlow team members for monitoring all businesses on the platform. This requires a new role (`superadmin`) that operates outside individual businesses.

---

### Role Architecture Change

Add a new enum value to `app_role`:

```text
Current:  owner | admin | driver
Proposed: owner | admin | driver | superadmin
```

Superadmin users will NOT have a `business_id` — they operate across all businesses. Their `user_roles` entry will have `business_id = NULL` (requires making that column nullable or using a sentinel value).

**Alternative (cleaner)**: Create a separate `platform_admins` table rather than mixing platform-level roles with business-level roles:

```text
platform_admins
├── id (uuid, PK)
├── user_id (uuid, references auth.users)
├── created_at (timestamptz)
└── role (text, default 'superadmin')
```

This keeps the existing business role system untouched and avoids RLS complexity.

---

### New Routes and Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/superadmin` | SuperadminDashboard | Overview: total businesses, total users, recent signups |
| `/superadmin/businesses` | BusinessList | All businesses with filters, status, subscription tier |
| `/superadmin/businesses/:id` | BusinessDetail | View business details, their users, override subscription |
| `/superadmin/users` | UserList | All platform users, search, edit name/email |

---

### Dashboard Metrics

```text
┌──────────────────────────────────────────────────────────────────┐
│  KhipuFlow Admin Dashboard                                       │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│ Total        │ Active       │ Free Trial   │ New This Week       │
│ Businesses   │ Businesses   │ Businesses   │                     │
│    42        │    28        │    14        │    5                │
├──────────────┴──────────────┴──────────────┴─────────────────────┤
│                                                                  │
│  Recent Business Signups                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Business Name  │ Owner      │ Signed Up   │ Status         │ │
│  │ Sweet Boxes    │ Ana L.     │ Feb 10      │ Free Trial     │ │
│  │ GiftCraft PE   │ Carlos M.  │ Feb 9       │ Active (Growth)│ │
│  │ Box Delight    │ Maria R.   │ Feb 8       │ Free Trial     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Total Users: 127  │  Avg Users/Business: 3.0                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Database Changes

#### 1. Platform Admins Table

```sql
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read this table
CREATE POLICY "Platform admins can read"
  ON public.platform_admins FOR SELECT
  USING (user_id = auth.uid());
```

#### 2. Security Definer Function

```sql
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;
```

#### 3. Subscription Tracking (on businesses table)

```sql
ALTER TABLE public.businesses ADD COLUMN subscription_tier text DEFAULT 'free_trial';
ALTER TABLE public.businesses ADD COLUMN subscription_status text DEFAULT 'active';
ALTER TABLE public.businesses ADD COLUMN trial_ends_at timestamptz DEFAULT (now() + interval '14 days');
```

#### 4. RLS for Superadmin Access

New policies on `businesses`, `profiles`, `user_roles`, `orders`, etc. allowing platform admins to read all data:

```sql
-- Example for businesses
CREATE POLICY "Platform admins can view all businesses"
  ON public.businesses FOR SELECT
  USING (is_platform_admin(auth.uid()));

-- Example for profiles (superadmin can also UPDATE name/email)
CREATE POLICY "Platform admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (is_platform_admin(auth.uid()));
```

---

### Superadmin Capabilities

| Capability | Description |
|------------|-------------|
| View all businesses | Name, currency, created date, subscription status |
| View business users | See all users within any business |
| Edit user profiles | Modify name and email for any user |
| Override subscription | Change tier (Free/Growth/Business), extend trials |
| View platform stats | Total businesses, users, signups over time |
| Monitor onboarding | See which businesses completed onboarding steps |

---

### Access Control

- Superadmin routes are protected by a `SuperadminRoute` component that checks `is_platform_admin(auth.uid())`
- Superadmin users log in through the same `/auth` page but get redirected to `/superadmin` instead of `/`
- The regular app navigation is hidden for superadmin users; they see their own sidebar/nav
- Initial superadmin users are seeded directly in the database (no self-registration)

---

### Edge Function for Profile Editing

An edge function `admin-update-profile` will handle updating user names and emails:

```text
Flow:
1. Verify caller is platform admin
2. Update profiles table (name, email)
3. If email changed, update auth.users email via admin API
4. Return success
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/superadmin/SuperadminDashboard.tsx` | Main dashboard with metrics |
| `src/pages/superadmin/BusinessList.tsx` | Table of all businesses |
| `src/pages/superadmin/BusinessDetail.tsx` | Single business view with users |
| `src/pages/superadmin/UserList.tsx` | All platform users |
| `src/components/superadmin/SuperadminRoute.tsx` | Auth guard for superadmin routes |
| `src/components/superadmin/SuperadminLayout.tsx` | Layout with superadmin nav |
| `supabase/functions/admin-update-profile/index.ts` | Edge function for profile edits |
| `supabase/migrations/xxx.sql` | Platform admins table, subscription columns, RLS policies |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add superadmin routes |
| `src/components/ProtectedRoute.tsx` | Add superadmin redirect logic |

---

### Implementation Phases

**Phase 1 (Foundation)**: Create `platform_admins` table, `is_platform_admin` function, subscription columns on businesses, and the `SuperadminRoute` guard. Build the main dashboard page with basic metrics.

**Phase 2 (Business Management)**: Business list with search/filter, business detail page, subscription override controls.

**Phase 3 (User Management)**: User list across all businesses, profile editing edge function, email change capability.

---

### Notes

- Superadmin users should be manually inserted into `platform_admins` via SQL -- no UI for creating superadmins
- The superadmin dashboard is completely separate from the business dashboard; no shared navigation
- All superadmin operations are gated by the `is_platform_admin` function at the RLS level
- This can be built incrementally -- start with Phase 1 for monitoring, add management features later
