## Rebrand to KhipuFlow + Landing Page Content Package

### Part 1: Rebranding (Code Changes)

All references to "GiftBox Manager" will be updated across the codebase:


| File                                                    | Change                              |
| ------------------------------------------------------- | ----------------------------------- |
| `index.html`                                            | Update `<title>` tag                |
| `src/pages/Index.tsx`                                   | Update hero title and description   |
| `src/components/layout/Header.tsx`                      | Update fallback business name       |
| `src/pages/BusinessOnboarding.tsx`                      | Update welcome text and placeholder |
| `src/components/onboarding/GettingStartedChecklist.tsx` | Update any branding references      |


---

### Part 2: Landing Page Content Guide

Below is a curated content structure for your landing page -- concise enough to avoid saturation, comprehensive enough to convey value.

---

#### Tagline Options

- "Streamline Your Gift Box Business, End to End."
- "From Inventory to Delivery -- All in One Flow."

#### One-Liner Description

> KhipuFlow is the all-in-one operations platform for gift box businesses. Manage inventory, build products, track orders, coordinate deliveries, and monitor revenue -- from a single dashboard.

---

#### Core Features (Currently Live)

These are the "hero" features for the landing page -- recommend showing 4-6 max with icons.


| Feature              | Short Description                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Real-Time Dashboard  | See total inventory value, active orders, monthly revenue, and low-stock alerts at a glance        |
| Inventory Management | Track items with costs, quantities, images, categories, reorder alerts, and budget monitoring      |
| Product Builder      | Assemble gift boxes from inventory items with automatic cost calculation and profit margin pricing |
| Order Kanban Board   | Drag-and-drop order tracking through 6 stages: New Inquiry to Completed                            |
| Delivery Workflow    | Assign drivers, generate confirmation links, capture delivery photos with GPS timestamps           |
| Team Management      | Invite admins and drivers with role-based access control                                           |


---

#### Secondary Features (Mention briefly, perhaps in a "Why KhipuFlow?" section)


| Feature                | One-Liner                                                           |
| ---------------------- | ------------------------------------------------------------------- |
| Multi-Currency Support | Operate in USD, EUR, GBP, PEN, MXN, BRL, COP, or CAD                |
| Budget Tracking        | Set and monitor monthly purchasing budgets                          |
| Low Stock Alerts       | Automatic warnings when inventory drops below reorder levels        |
| Driver Dashboard       | Dedicated mobile-friendly view for delivery drivers                 |
| Photo Delivery Proof   | Drivers upload proof-of-delivery photos directly from their phone   |
| Guided Onboarding      | Step-by-step checklist to get new businesses operational in minutes |


---

#### "Coming Soon" Features (Future Roadmap -- for a teaser section)


| Feature                       | Description                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Analytics and Reports         | Revenue trends, best-selling products, and seasonal insights with visual charts |
| CSV Data Export               | Export inventory, orders, and financial data for accounting                     |
| Customer Database             | Save repeat client info for faster order creation                               |
| Order History and Audit Trail | Full timeline of status changes with timestamps                                 |
| Custom Email Notifications    | Automated alerts for order updates and delivery confirmations                   |
| Dark Mode                     | Light and dark theme toggle                                                     |


---

#### Suggested Pricing Tiers


| Tier | Name     | Target                                  | Suggested Inclusions                                                                                |
| ---- | -------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Free | Starter  | Solo entrepreneurs testing the platform | 1 user, up to 50 inventory items, up to 20 orders/month, basic dashboard                            |
| Paid | Growth   | Small teams actively fulfilling orders  | Up to 5 users, unlimited inventory and orders, delivery workflow, budget tracking, priority support |
| Paid | Business | Established operations with drivers     | Unlimited users, all features, analytics (when available), CSV export, dedicated onboarding support |


Note: Pricing amounts are not included since those are a business decision. The tiers are structured around natural usage limits that align with team size and operational scale.

---

#### Landing Page Section Structure (Recommended Flow)

```text
1. Hero
   - Tagline + one-liner + CTA ("Get Started Free")
   - App screenshot or mockup

2. Core Features (4-6 cards with icons)
   - Dashboard, Inventory, Products, Orders, Delivery, Team

3. How It Works (3 steps)
   - Step 1: Set up your business (name + currency)
   - Step 2: Add inventory and build products
   - Step 3: Track orders and deliver

4. Why KhipuFlow? (Secondary features as bullet list)
   - Multi-currency, budget tracking, low-stock alerts, etc.

5. Coming Soon (Roadmap teaser)
   - 3-4 upcoming features with "notify me" option

6. Pricing (When ready)
   - Starter / Growth / Business tiers

7. CTA Footer
   - "Start managing your gift box business today"
   - Sign up button
```

---

### Implementation Scope

The code changes for this task are limited to rebranding only (replacing "GiftBox Manager" with "KhipuFlow"). The landing page content above is a reference document for when you build the actual landing page -- no landing page code will be created in this task.

### Files to Modify


| File                               | Change                                                  |
| ---------------------------------- | ------------------------------------------------------- |
| `index.html`                       | Title to "KhipuFlow"                                    |
| `src/pages/Index.tsx`              | Hero text: "Welcome to KhipuFlow" + updated description |
| `src/components/layout/Header.tsx` | Fallback name: "KhipuFlow"                              |
| `src/pages/BusinessOnboarding.tsx` | "Welcome to KhipuFlow!"                                 |
| `public/robots.txt`                | Update if it contains old branding                      |
