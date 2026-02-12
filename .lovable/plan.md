

## KhipuFlow Visual Refresh

A styling-only update to give the app a polished, branded look using the KhipuFlow logo colors. No backend changes, no feature changes, no data flow modifications.

---

### Brand Colors (from logo)

- **Navy Blue**: `#1B3A5C` (dark navy from the "K" and text)
- **Ocean Blue**: `#2E5C8A` (medium blue from the chevron)
- **Warm Orange**: `#E8873D` (accent orange from the swoosh)
- **Light Orange**: `#F5A623` (lighter accent for hover states)

These will replace the current generic shadcn defaults while keeping the HSL variable system intact.

---

### What Changes

#### 1. Color Theme (`src/index.css`)

Update CSS custom properties to use KhipuFlow brand colors:

- **Primary**: Navy blue (from logo text) -- buttons, active tabs, links
- **Accent**: Warm orange (from logo swoosh) -- highlights, progress bars, CTAs
- **Background**: Subtle warm white instead of pure white
- **Cards**: Slightly warmer card backgrounds
- **Destructive**: Keep red for warnings/errors
- **Dark mode**: Adjusted navy-based dark palette

This single file change cascades through the entire app since all components use CSS variables.

#### 2. Logo Integration

- Copy the uploaded logo to `src/assets/khipuflow-logo.png`
- Show the logo in the Header (replacing the text-only "KhipuFlow" or business name area)
- Show the logo on the Auth page (replacing the generic Package icon)
- Show the logo on the Business Onboarding page

#### 3. Header Upgrade (`src/components/layout/Header.tsx`)

- Add a subtle gradient or navy background instead of plain white
- Display the KhipuFlow logo (small, ~32px height)
- Better visual separation with a soft shadow instead of just `border-b`
- Warm the user avatar area with an orange accent ring

#### 4. Tab Navigation (`src/components/layout/TabNavigation.tsx`)

- Active tab uses orange underline (brand accent) instead of the default primary
- Slight background tint on hover
- Smoother transition animations

#### 5. Dashboard Cards (`src/pages/Dashboard.tsx`)

- Stat cards get subtle gradient backgrounds using brand colors (e.g., light blue tint for inventory, light orange for revenue)
- Icon backgrounds get colored circles instead of plain muted icons
- Cards get a soft hover elevation effect
- "Getting Started" checklist maintains its current gradient but uses brand orange for progress

#### 6. Auth Page (`src/pages/Auth.tsx`)

- Replace the Package icon with the actual KhipuFlow logo
- Add a branded gradient background (navy to blue)
- Auth card gets a subtle backdrop blur effect
- Sign In/Sign Up buttons use brand navy, with orange accent on hover

#### 7. Order Kanban (`src/components/orders/OrderKanban.tsx`)

- Column headers get subtle colored backgrounds matching their status colors
- Cards get refined shadows and spacing
- Better visual hierarchy with font weight adjustments

#### 8. General UI Polish (multiple files)

- Page headers: Add a subtle welcome greeting on Dashboard
- Buttons: Primary buttons use navy, secondary use a warm gray
- Badges: Use brand colors for status badges
- Empty states: Better styled with brand illustrations/colors
- Input focus rings: Orange accent instead of default ring color

#### 9. Business Onboarding (`src/pages/BusinessOnboarding.tsx`)

- Add KhipuFlow logo at top
- Match the branded gradient background from Auth page

---

### Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Update all CSS custom properties with brand colors |
| `src/components/layout/Header.tsx` | Add logo, gradient header, shadow |
| `src/components/layout/TabNavigation.tsx` | Orange active indicator, hover states |
| `src/pages/Dashboard.tsx` | Colored stat card icons, hover effects |
| `src/pages/Auth.tsx` | Logo, branded gradient background |
| `src/pages/BusinessOnboarding.tsx` | Logo, branded background |
| `src/pages/Orders.tsx` | Page header styling |
| `src/pages/Inventory.tsx` | Page header styling |
| `src/pages/Products.tsx` | Page header styling |
| `src/pages/UserManagement.tsx` | Page header styling |
| `src/components/orders/OrderKanban.tsx` | Column header styling |
| `src/components/inventory/BudgetCard.tsx` | Styled budget sections |
| `src/components/onboarding/GettingStartedChecklist.tsx` | Brand color progress |

### New Files

| File | Purpose |
|------|---------|
| `src/assets/khipuflow-logo.png` | Logo asset copied from upload |

---

### Design Principles

- **Inspired by**: Sortly (inventory), ShipBob (fulfillment), Katana (manufacturing) -- clean layouts with subtle brand colors, not overwhelming
- **Color usage**: Navy for structure/primary actions, orange for accents/highlights/CTAs, white/light gray for breathing room
- **No feature changes**: All data queries, mutations, business logic, and routing remain untouched
- **Consistent**: Every page gets the same treatment so the app feels cohesive
- **Mobile-friendly**: All styling updates use existing responsive breakpoints

