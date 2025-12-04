🏗 Architecture & Tech Stack

This application was architected to balance rapid development with a robust, scalable backend. It leverages a modern stack to ensure performance and security.

Frontend: React + Vite (Accelerated using Lovable.dev)

Styling: Tailwind CSS + Shadcn UI

Backend: Supabase (PostgreSQL)

Authentication: Supabase Auth

State Management: TanStack Query

💡 Solution Overview

As a Technical Solutions Architect, I designed this system to solve the common fragmentation problem in inventory management. The goal was to create a centralized "source of truth" that connects inventory levels directly with order processing and budget tracking.

Key Features:

Real-Time Analytics Dashboard: Instant visibility into Total Inventory Value, Active Orders, and Monthly Revenue using live data subscriptions.

Budget Tracking: Integrated budget overview to monitor spend vs. allocation in real-time.

Inventory & Product Management: CRUD operations for complex product catalogs.

Order Lifecycle Management: Full workflow for tracking orders from "New Inquiry" to "Completed" or "Cancelled."

Multi-Currency Support: Built with localization in mind (currently configured for PEN/Sol).

🚀 Why Supabase?

Supabase was chosen as the backend infrastructure to leverage:

Row Level Security (RLS): To ensure secure data access patterns for the "Team" functionality.

Realtime Subscriptions: To update the dashboard metrics immediately as new orders are placed.
