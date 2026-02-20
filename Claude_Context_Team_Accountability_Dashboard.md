# Project Context: Team Accountability Dashboard (Fireflies.AI OS)

## High-Level Objective
The goal of this project is to build an "Execution Intelligence" layer on top of our existing Notion database. CEO Krish has outlined specific goals for Q1 focusing on scaling leadership without 1:1s, enforcing individual accountability, identifying trends, and unblocking the team at scale. 

Instead of moving the team to a new tool, we built a read-only, highly visual React/Next.js dashboard ("visor") that aggregates and visualizes the Notion data. If the team updates Notion, the dashboard updates automatically.

## Core Strategy: Vision Visualization

Here is the high-level mapping of how every technical decision in this dashboard responds to Krish's specific leadership goals:

1. **Krish's Goal: Scaling without 1:1s**
   * **Dashboard Implementation**: Built **Executive Drill-down & In-Page Panels**. Krish can click on "Overdue" metrics and view a slide-out panel instantly detailing who is stuck, preventing 20 minutes of digging through Notion pages.
2. **Krish's Goal: Individual Accountability**
   * **Dashboard Implementation**: Built the **Intelligence Console & Recent Activity Feed**. High-density grids replace bulky cards. Every owner has a "Velocity Sparkline" (mini chart showing 4-week output) to detect burnout early.
3. **Krish's Goal: Focus on Trends/Deltas**
   * **Dashboard Implementation**: Built **Metric Trend Charting**. Every metric shows delta arrows and history. Visual area charts have 14/30/90-day interactive toggles to track movement, not just static status.
4. **Krish's Goal: Signal Clarity**
   * **Dashboard Implementation**: Built **Risk Suppression & Intelligence Inbox**. "Green" status work is noise-filtered out. The Inbox aggregates 🔴 Risk Alerts (individuals with failing scores) and Overdue items automatically. Logic tooltips explain exactly how the algorithmic Health Score is calculated.
5. **Krish's Goal: Unblocking at Scale**
   * **Dashboard Implementation**: Built the **Watchlist Toggle**. One click hides healthy work and instantly highlights the hidden fires across the company.
6. **Krish's Goal: One Source of Truth**
   * **Dashboard Implementation**: **Visual Layer Architecture**. Zero new tools. We sync strictly via the Notion API, respecting Greg's existing data structure.

---

## Technical Architecture & Core UI Components

The application is built with Next.js (React) and styled with raw CSS (`globals.css`) for a custom, premium Dark Mode operational feel.

### 1. Workspace Layout & Navigation (`DashboardLayout.js`)
* **Notion-Style Resizable Sidebar**: Fully resizable via click-and-drag. Snaps to a collapsed state (icons only) to maximize horizontal screen real estate for complex charts.
* **Header Architecture**: Features live sync timestamps, manual refresh, Theme Toggle (Light/Dark), and a Profile Avatar Dropdown.
* **Profile & Settings Modal**: 
  * Replaced the old Fred Hub button with a standard Avatar profile menu.
  * Settings modal includes tabs for: Appearance (Theme), Inbox & Alerts (toggle risk notifications), Data & Sync (auto-refresh interval polling), and Preferences (default startup view).

### 2. The Centralized "Inbox" Notification Slide-out
* A slide-out panel accessible from the sidebar. It aggregates every Red Risk Alert, Blocked Item, and Overdue Goal across the company.
* Supports **Filtering** (Unread, Read, Archived, All).
* Allows managers to **Archive** completed fires (via local storage persistence) so they can focus purely on what needs rescuing today.

### 3. The Four Core Views

#### A. Company View (`/company`)
* The "10-second health check" for the CEO.
* Features the **Execution Trend Area Chart**: Visualizes output with 14/30/90-day time horizons and Daily/Weekly groupings.
* Displays the global **Algorithmic Health Score (0-100)** with hover tooltips explaining the penalty weights for overdue or slipping items.

#### B. Individual View (`/individual` - The Intelligence Console)
* High-density cockpit for Operations/HR.
* Features a list of every Independent Contributor.
* **Velocity Sparklines**: Mini bar charts next to every person showing their output over the last 4 weeks. Detects disengagement if a top performer suddenly has 3 empty bars.
* **The "Stale" Signal**: A clock icon visually alerts if any active goal hasn't been updated in Notion for >5 days (Quiet Quitting detection).

#### C. Squads View (`/squads`)
* Answers "Which team is struggling?" (e.g., Engineering, Marketing).
* Tracks **Ownership Clarity %**: The percentage of a squad's goals assigned to a specific DRI vs. "Unassigned".
* Features **In-Page Slide-out Panels**: Clicking a squad opens a smooth overlay panel detailing their specific members and OKR blockers without navigating away from the high-level metrics.

#### D. Executive View (`/executive`)
* Pure Krish Mode. Stripped-down view for the 10-minute daily review.
* Focuses exclusively on the **Top 5 Risks** in the company (High Priority + Overdue/Blocked) to give him a prioritized "hit list" for unblocking.

---

## Future Roadmap (Goal #10)
Krish wants to aggregate what already exists (GitHub, Shortcut, Slack). The roadmap includes Phase 4 (integrating GitHub PR data to automatically populate velocity without manual Notion entry) and Phase 5 (Slack sentiment scans to flag motivation issues before performance degrades).
