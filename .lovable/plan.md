

## Full Platform Workflow Review + User Auth Deletion

### Critical Bug: Double Inventory Deduction

This is the most important finding. There are **two systems** deducting inventory, causing double-counting:

1. **OrderDialog.tsx (lines 108-151)**: Deducts inventory components AND product quantity immediately when an order is created at "New Inquiry" status
2. **Database trigger `deduct_inventory_on_order_complete`**: Deducts the same inventory again when the order moves to "Completed"

**Result**: Every completed order deducts inventory twice.

Additionally, the `restore_inventory_on_order_cancel` trigger only restores inventory when cancelling FROM "Completed". If an order is cancelled from any other status (e.g., "In Progress"), the inventory deducted at creation is never restored.

**Fix**: Remove the frontend inventory deduction from `OrderDialog.tsx` and `OrderEditDialog.tsx`. Let the database triggers handle all inventory changes. The frontend should only create/update the order record.

---

### User Auth Deletion (Your Question)

Currently when removing a user:
- Role is deleted from `user_roles`
- `business_id` is cleared from `profiles` via `clear_user_business` RPC
- Auth account remains (user can still log in but lands on onboarding)

**Solution**: Create an edge function `delete-user` that uses the Supabase Admin API to fully delete the auth account. This allows the same email to be re-invited to another business cleanly.

**Implementation**:
- New edge function: `supabase/functions/delete-user/index.ts`
- Verifies the caller is a business owner
- Verifies the target user is in the caller's business
- Deletes the auth user via `supabase.auth.admin.deleteUser()`
- Cascade delete handles `profiles` and `user_roles` cleanup automatically (profiles FK has ON DELETE CASCADE implied by the trigger setup)

Note: The profiles table doesn't have ON DELETE CASCADE on the auth.users FK, so the edge function will need to manually clean up the profile and roles before deleting the auth user.

---

### Header Currency Selector Bug

The `Header.tsx` currency selector (line 18-29) is hardcoded to only 3 currencies (USD, CAD, PEN) and doesn't use the centralized `currencies` list from `src/lib/currencies.ts`. This contradicts the expanded currency support added to BusinessOnboarding and BusinessSettings.

**Fix**: Either update the Header selector to use the full currencies list, or remove it entirely since the same functionality exists in Business Settings. Removing it simplifies the UI.

---

### Team Tab Visibility Mismatch

`TabNavigation.tsx` (line 20) shows the Team tab for both owners AND admins. However, `UserManagement.tsx` blocks non-owners with an "Access Denied" screen. Admins see the tab but can't use it.

**Fix**: Either restrict the tab to owners only, or allow admins to view (but not manage) the team roster.

---

### Missing Features for Beta Testing

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| Critical | Fix double inventory deduction | Remove frontend deduction, rely on DB triggers | Medium |
| Critical | User auth deletion | Edge function to fully remove users | Medium |
| High | Fix Header currency selector | Use centralized currencies or remove from header | Low |
| High | Fix Team tab for admins | Match visibility with actual permissions | Low |
| Medium | Role editing | Allow owners to change admin/driver roles | Low |
| Medium | Proper delete confirmations | Replace browser `confirm()` with AlertDialog for products/inventory | Low |
| Low | Dark mode toggle | Add theme switcher to header | Low |

---

### Implementation Plan

#### 1. Fix Double Inventory Deduction (Critical)

**Files to modify:**
- `src/components/orders/OrderDialog.tsx` -- Remove lines 108-151 (inventory deduction on creation) and lines 144-151 (product quantity update on creation)
- `src/components/orders/OrderEditDialog.tsx` -- Remove all inventory adjustment logic (lines 71-170). Order edits should only update order fields, not inventory.

The database triggers `deduct_inventory_on_order_complete` and `restore_inventory_on_order_cancel` will be the single source of truth for inventory changes.

**Important consideration**: The current trigger only deducts on "Completed". This means inventory shown as "available" won't reflect pending orders. This is actually the simpler and more correct approach -- inventory represents what's physically in stock, and only gets deducted when an order is actually fulfilled.

#### 2. Create User Deletion Edge Function

**New file:** `supabase/functions/delete-user/index.ts`

```text
Flow:
1. Receive request with target user_id
2. Verify caller is authenticated
3. Verify caller has 'owner' role
4. Verify target user is in caller's business
5. Verify target user is NOT an owner
6. Delete user_roles records
7. Delete profile record
8. Delete auth user via admin API
9. Return success
```

**Modify:** `src/pages/UserManagement.tsx` -- Update `removeUserMutation` to call the edge function instead of direct Supabase queries.

#### 3. Fix Header Currency Selector

**File:** `src/components/layout/Header.tsx`
- Remove the currency selector entirely (lines 42-53) since Business Settings already handles this
- This avoids confusion and the hardcoded currency list issue

#### 4. Fix Team Tab Visibility

**File:** `src/components/layout/TabNavigation.tsx`
- Change line 20 to only show Team tab for owners: `...(isOwner ? [{ to: '/team', ... }] : [])`

#### 5. Add Role Editing

**File:** `src/pages/UserManagement.tsx`
- Add a role selector dropdown in each team member row (for non-owner members)
- Create a mutation that updates the `user_roles` table

#### 6. Replace Browser confirm() with AlertDialog

**Files:**
- `src/pages/Products.tsx` -- Replace `confirm()` on line 74 with AlertDialog
- `src/pages/Inventory.tsx` -- Replace `confirm()` on line 150 with AlertDialog

---

### Summary of All Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/components/orders/OrderDialog.tsx` | Modify | Remove frontend inventory deduction |
| `src/components/orders/OrderEditDialog.tsx` | Modify | Remove frontend inventory adjustment |
| `supabase/functions/delete-user/index.ts` | Create | Edge function for full user deletion |
| `src/pages/UserManagement.tsx` | Modify | Use edge function for removal + add role editing |
| `src/components/layout/Header.tsx` | Modify | Remove duplicate currency selector |
| `src/components/layout/TabNavigation.tsx` | Modify | Fix team tab visibility for admins |
| `src/pages/Products.tsx` | Modify | Replace confirm() with AlertDialog |
| `src/pages/Inventory.tsx` | Modify | Replace confirm() with AlertDialog |

