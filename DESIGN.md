# Design System & UI/UX Guidelines (DESIGN.md)
## Tallyon — Modern Expense Tracker

This document establishes the official visual design principles, color palette, typography system, component specifications, and layout standards for **Tallyon**. Inheriting the clean, royal-blue-accented aesthetic and thoughtful micro-interactions from the `reference` codebase, this guide ensures high credibility, clarity, and intuitive financial data management.

---

## 1. Core Principles & Layout Standards

1. **Clarity & Trust in Financial Presentation**
   - High-contrast typography and structured information hierarchy ensure that critical financial metrics (expenses, income, net balance, and budget progress) are legible at a glance.
   - Elimination of unnecessary visual noise to focus on clean numerical insights and actionable summaries.

2. **Unified White-Blue Theme Continuity**
   - Retains the signature **Royal Blue (`#2563EB`)** primary accent from `reference` to deliver an intellectual, dependable, and modern aesthetic.
   - Introduces functional, harmonized status accents: **Rose/Red** for expenses and warnings, and **Emerald/Green** for income and positive progress.

3. **Standardized 960px Container Width**
   - All core views—dashboard KPI cards, timeline views, expense logs, and analytical charts—are strictly constrained to a **`960px`** maximum width for consistent visual alignment and comfortable reading ergonomics.

4. **Pill-Shaped Navigation & Filter Tabs**
   - Navigation and filter controls (e.g., Monthly/Weekly/Daily views, Category chips) adopt rounded capsule styling (`border-radius: 9999px`, `#F1F5F9` subtle background, smooth active tab transitions) matching the reference header navigation pattern.

5. **Fluid Micro-Interactions & Transitions**
   - Subtle hover elevations (`box-shadow`, 1px border transitions), smooth budget progress bars, and tabular numeric transitions provide a tactile and responsive feel.

---

## 2. Unified Color Palette

```css
:root {
  /* Surface & Background Colors */
  --bg-primary: #FFFFFF;         /* Main canvas background */
  --bg-secondary: #F8FAFC;       /* Card and widget backgrounds (Slate-50) */
  --bg-tertiary: #EFF6FF;        /* Highlight & active row tint (Blue-50) */
  --bg-dark: #0F172A;            /* Deep dark tone (Slate-900) */
  --bg-subtle: #F1F5F9;          /* Pill containers & input fill (Slate-100) */

  /* Unified Royal Blue Theme Palette */
  --primary-blue: #2563EB;       /* Royal Blue primary accent (Blue-600) */
  --primary-blue-hover: #1D4ED8; /* Primary hover state (Blue-700) */
  --primary-blue-light: #60A5FA; /* Secondary blue (Blue-400) */
  --primary-blue-tint: #DBEAFE;  /* Badges & soft focus rings (Blue-100) */

  /* Financial & Functional Status Colors */
  --expense-rose: #E11D48;       /* Expense indicator & negative figures */
  --expense-bg: #FFE4E6;         /* Expense badge background (Rose-100) */
  --income-emerald: #059669;     /* Income indicator & savings positive */
  --income-bg: #D1FAE5;          /* Income badge background (Emerald-100) */
  --warning-amber: #D97706;      /* Budget warning & alert threshold */
  --warning-bg: #FEF3C7;         /* Warning badge background (Amber-100) */

  /* Borders & Dividers */
  --border-light: #E2E8F0;       /* Standard container border (Slate-200) */
  --border-subtle: #F1F5F9;      /* Subtle separator lines (Slate-100) */
  --border-focus: #2563EB;       /* Input & focus border */

  /* Typography Colors */
  --text-primary: #0F172A;       /* Primary headlines & values (Slate-900) */
  --text-secondary: #475569;     /* Subheadings & body copy (Slate-600) */
  --text-muted: #94A3B8;         /* Timestamps, labels, placeholders (Slate-400) */
  --text-on-dark: #FFFFFF;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03);
}
```

---

## 3. Typography System

- **Font Families**:
  - Latin & Numerical: `'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  - Korean / CJK fallback: `'Noto Sans KR', sans-serif`
  - Number Display: `font-variant-numeric: tabular-nums;` strictly enforced on all currency figures and timestamps to prevent layout jitter during data updates.

- **Type Scale**:
  - **KPI Hero Metric**: `2.25rem ~ 2.75rem` (36px–44px), `font-weight: 800`, `letter-spacing: -0.03em`
  - **Section Titles (H2)**: `1.5rem ~ 1.75rem` (24px–28px), `font-weight: 700`, `letter-spacing: -0.02em`
  - **Widget / Card Headers (H3)**: `1.0rem` (16px), `font-weight: 600`, `color: var(--text-secondary)`
  - **Entry Title / Item Label**: `0.9375rem` (15px), `font-weight: 500`, `color: var(--text-primary)`
  - **Metadata & Subtext**: `0.8125rem` (13px), `font-weight: 600`, `color: var(--text-muted)`

---

## 4. UI Component Guidelines

### 4.1. Header & Period Selector
- Sticky header (`sticky top-0`, `z-index: 50`, `backdrop-filter: blur(12px)`) with subtle bottom border.
- Centered pill navigation bar for period selection (`This Month`, `Last Month`, `Custom Range`, `Insights`).
- Action CTA: Primary blue button with quick-add trigger (`+ New Transaction`).

### 4.2. Metric Summary Cards (Dashboard KPI)
- 3-Column responsive grid:
  1. **Total Spent**: Highlighted with soft rose badge and bold expense currency.
  2. **Total Income**: Highlighted with soft emerald badge and positive sign.
  3. **Monthly Budget & Remaining**: Visual progress bar indicating percentage utilized, dynamically switching to amber warning at >85% consumption.

### 4.3. Expense Timeline & Transaction List
- Adopts the `reference` **Timeline Tree Structure** (`timeline-tree` with vertical continuous stem):
  - **Date Node Badge**: Pill badge grouping entries by date (e.g., `Sep 07, 2026`).
  - **Timeline Item Entry**:
    - Left: Category icon circle (`timeline-icon-circle`: Food, Transport, Housing, Shopping, Bills, etc.).
    - Center: Merchant title, notes, and payment method tag (`Credit Card`, `Cash` - using `tag-pill-outline`).
    - Right: Signed amount (`- ₩35,000` / `+ ₩1,200,000`) styled with appropriate semantic colors.
    - Quick actions on hover: Edit / Delete icon buttons.

### 4.4. Transaction Modal & Input Forms
- Clean modal card container (`border-radius: 16px`, `border: 1px solid var(--border-light)`).
- Inputs with interactive focus glow (`outline: 2px solid var(--primary-blue-tint)`, `border-color: var(--primary-blue)`).
- Thousand-separator auto-formatting for currency inputs.
- Quick category selector chip grid with active pill styling.

### 4.5. Data Visualization & Analytics
- Clean category breakdown charts (doughnut or stacked progress bars) utilizing a curated blue-spectrum palette (`#2563EB`, `#3B82F6`, `#60A5FA`, `#93C5FD`, `#475569`).
- Interactive tooltips with clear breakdown percentages and sums.

---

## 5. Technical Stack & Implementation Architecture

- **Framework**: React 19 + TypeScript + Vite (identical modern setup as `reference`).
- **Styling**: Vanilla CSS / CSS Modules utilizing strict CSS custom properties (`index.css` tokens) for maximum performance and zero dependency overhead.
- **Icons**: `lucide-react` (comprehensive iconography for categories, transactions, and interface controls).
- **State & Storage**: React Context + custom hooks with persistent `localStorage` support (structured for seamless backend/API integration).
- **Layout Constraint**: Strict adherence to `.container` (`max-width: 960px; margin: 0 auto;`).
